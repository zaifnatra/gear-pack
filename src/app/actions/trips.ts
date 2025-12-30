'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TripType, Difficulty, TripVisibility, ParticipantRole, NotificationType } from '@prisma/client'
import { createNotification } from './notifications'

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

export async function inviteUserToTrip(tripId: string, friendId: string, organizerId: string) {
    try {
        // Verify organizer ownership
        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
        })

        if (!trip || trip.organizerId !== organizerId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check if already invited or joined
        const existingParticipant = await prisma.participant.findUnique({
            where: {
                userId_tripId: {
                    userId: friendId,
                    tripId: tripId
                }
            }
        })

        if (existingParticipant) {
            return { success: false, error: 'User is already a participant or invited' }
        }

        await prisma.participant.create({
            data: {
                tripId,
                userId: friendId,
                role: 'GUEST',
                status: 'INVITED'
            }
        })

        await createNotification(
            friendId,
            NotificationType.TRIP_INVITE,
            `You've been invited to join the trip "${trip.name}"`,
            '/dashboard/trips'
        )

        revalidatePath('/dashboard/trips')
        return { success: true }
    } catch (error) {
        console.error('Failed to invite user:', error)
        return { success: false, error: 'Failed to invite user' }
    }
}

export async function respondToTripInvite(tripId: string, userId: string, status: 'ACCEPTED' | 'DECLINED') {
    try {
        const participant = await prisma.participant.findUnique({
            where: {
                userId_tripId: {
                    userId: userId,
                    tripId: tripId
                }
            }
        })

        if (!participant || participant.status !== 'INVITED') {
            return { success: false, error: 'Invalid invitation' }
        }

        if (status === 'DECLINED') {
            // Remove the record if declined
            await prisma.participant.delete({
                where: {
                    userId_tripId: {
                        userId: userId,
                        tripId: tripId
                    }
                }
            })
        } else {
            // Update to ACCEPTED
            await prisma.participant.update({
                where: {
                    userId_tripId: {
                        userId: userId,
                        tripId: tripId
                    }
                },
                data: {
                    status: 'ACCEPTED',
                    role: 'MEMBER' // Upgrade to member on accept
                }
            })
        }

        revalidatePath('/dashboard/trips')
        return { success: true }
    } catch (error) {
        console.error('Failed to respond to invite:', error)
        return { success: false, error: 'Failed to respond to invite' }
    }
}

export async function getTripInvites(userId: string) {
    try {
        const invites = await prisma.participant.findMany({
            where: {
                userId: userId,
                status: 'INVITED'
            },
            include: {
                trip: {
                    include: {
                        organizer: {
                            select: { fullName: true, username: true, avatarUrl: true }
                        }
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            }
        })

        // Flatten the data structure slightly for easier consumption if needed, or return as is
        return { success: true, data: invites.map(i => i.trip) }
    } catch (error) {
        console.error('Failed to get invites:', error)
        return { success: false, error: 'Failed to get invites' }
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

export async function getFriendTrips(userId: string) {
    try {
        // 1. Get all friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: userId, status: 'ACCEPTED' },
                    { friendId: userId, status: 'ACCEPTED' }
                ]
            }
        })

        const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId)

        if (friendIds.length === 0) {
            return { success: true, data: [] }
        }

        // 2. Get trips organized by friends that are not PRIVATE
        const trips = await prisma.trip.findMany({
            where: {
                organizerId: { in: friendIds },
                visibility: { not: 'PRIVATE' }
            },
            include: {
                organizer: {
                    select: { id: true, fullName: true, username: true, avatarUrl: true }
                },
                _count: {
                    select: { participants: true }
                }
            },
            orderBy: {
                startDate: 'desc' // Most recent created/starting
            },
            take: 20
        })

        return { success: true, data: trips }
    } catch (error) {
        console.error('Failed to get friend trips:', error)
        return { success: false, error: 'Failed to get friend trips' }
    }
}
