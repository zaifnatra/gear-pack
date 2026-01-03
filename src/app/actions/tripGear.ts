'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTripGear(tripId: string) {
    try {
        const gear = await prisma.tripGear.findMany({
            where: { tripId },
            include: {
                gear: {
                    include: { category: true }
                },
                carrier: {
                    select: { id: true, fullName: true, avatarUrl: true, username: true }
                }
            },
            orderBy: {
                gear: {
                    name: 'asc'
                }
            }
        })
        return { success: true, data: gear }
    } catch (error) {
        console.error('Failed to fetch trip gear:', error)
        return { success: false, error: 'Failed to fetch trip gear' }
    }
}

export async function addGearToTrip(tripId: string, gearId: string, userId: string, isShared: boolean = false) {
    try {
        // Check if already added
        const existing = await prisma.tripGear.findFirst({
            where: { tripId, gearId }
        })

        if (existing) {
            return { success: false, error: 'Item already added to trip' }
        }

        const tripGear = await prisma.tripGear.create({
            data: {
                tripId,
                gearId,
                isShared,
                carriedById: userId, // Initially carried by adder? Or null if shared? Let's assume adder carries unless reassigned.
                quantity: 1,
                isPacked: false
            }
        })

        revalidatePath(`/dashboard/trips/${tripId}`)
        return { success: true, data: tripGear }
    } catch (error) {
        console.error('Failed to add gear to trip:', error)
        return { success: false, error: 'Failed to add gear to trip' }
    }
}

export async function togglePacked(tripGearId: string, isPacked: boolean) {
    try {
        await prisma.tripGear.update({
            where: { id: tripGearId },
            data: { isPacked }
        })

        // No revalidate needed if we use optimistic updates on client, 
        // but revalidating ensures consistency for others.
        // We'll skip revalidatePath here for performance if we do strict client opt-updates,
        // but for now let's be safe.
        // Actually, we can't easily revalidate the specific trip page from here without knowing tripId.
        // We can fetch it first or just return success.

        return { success: true }
    } catch (error) {
        console.error('Failed to update packed status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function removeGearFromTrip(tripGearId: string) {
    try {
        // We need to know tripId to revalidate
        const item = await prisma.tripGear.delete({
            where: { id: tripGearId },
            select: { tripId: true }
        })

        revalidatePath(`/dashboard/trips/${item.tripId}`)
        return { success: true }
    } catch (error) {
        console.error('Failed to remove gear:', error)
        return { success: false, error: 'Failed to remove gear' }
    }
}

export async function addMultipleGearToTrip(tripId: string, gearIds: string[], userId: string, isShared: boolean = false) {
    try {
        // 1. Find existing items to avoid duplicates
        const existing = await prisma.tripGear.findMany({
            where: {
                tripId,
                gearId: { in: gearIds }
            },
            select: { gearId: true }
        })

        const existingIds = new Set(existing.map(e => e.gearId))
        const newIds = gearIds.filter(id => !existingIds.has(id))

        if (newIds.length === 0) {
            return { success: true, count: 0, message: 'All selected items were already in the trip.' }
        }

        // 2. Bulk create
        await prisma.tripGear.createMany({
            data: newIds.map(gearId => ({
                tripId,
                gearId,
                isShared,
                carriedById: userId,
                quantity: 1,
                isPacked: false
            }))
        })

        revalidatePath(`/dashboard/trips/${tripId}`)
        return { success: true, count: newIds.length }
    } catch (error) {
        console.error('Failed to add multiple gear:', error)
        return { success: false, error: 'Failed to add items' }
    }
}
