'use server'

import { prisma } from '@/lib/prisma'
import { TripType, Difficulty, TripVisibility } from '@prisma/client'

export async function createTrip(userId: string, data: {
    name: string
    location?: string
    startDate: string | Date
    endDate?: string | Date
    type: TripType
    difficulty: Difficulty
    distance?: number
    elevationGain?: number
    description?: string
    externalUrl?: string
    visibility?: TripVisibility
}) {
    try {
        const trip = await prisma.trip.create({
            data: {
                organizer: { connect: { id: userId } },
                name: data.name,
                location: data.location || null,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                type: data.type,
                difficulty: data.difficulty,
                distance: data.distance || null,
                elevationGain: data.elevationGain || null,
                description: data.description || null,
                externalUrl: data.externalUrl || null,
                visibility: data.visibility || 'FRIENDS_ONLY',

                // Add organizer as a participant automatically
                participants: {
                    create: {
                        userId: userId,
                        role: 'ORGANIZER',
                        status: 'ACCEPTED'
                    }
                }
            }
        })
        return { success: true, data: trip }
    } catch (error) {
        console.error('Failed to create trip:', error)
        return { success: false, error: 'Failed to create trip' }
    }
}

export async function getTrips(userId: string) {
    try {
        // Fetch trips where user is a participant
        const trips = await prisma.trip.findMany({
            where: {
                participants: {
                    some: { userId: userId }
                }
            },
            include: {
                participants: {
                    include: { user: true }
                },
                _count: {
                    select: { gearList: true }
                }
            },
            orderBy: {
                startDate: 'asc' // Upcoming first
            }
        })
        return { success: true, data: trips }
    } catch (error) {
        console.error('Failed to fetch trips:', error)
        return { success: false, error: 'Failed to fetch trips' }
    }
}

export async function getTrip(tripId: string) {
    try {
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, avatarUrl: true, username: true }
                        }
                    }
                },
                organizer: {
                    select: { id: true, fullName: true, avatarUrl: true }
                }
            }
        })
        return { success: true, trip }
    } catch (error) {
        console.error('Failed to fetch trip:', error)
    }
}

export async function deleteTrip(tripId: string, userId: string) {
    try {
        // Verify ownership
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            select: { organizerId: true }
        })

        if (!trip || trip.organizerId !== userId) {
            return { success: false, error: 'Unauthorized to delete this trip' }
        }

        await prisma.trip.delete({
            where: { id: tripId }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to delete trip:', error)
        return { success: false, error: 'Failed to delete trip' }
    }
}
