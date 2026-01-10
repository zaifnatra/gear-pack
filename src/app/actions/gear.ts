'use server'

import { prisma } from '@/lib/prisma'

export async function getGearItems(userId: string) {
    try {
        const gear = await prisma.gearItem.findMany({
            where: {
                userId: userId,
            },
            include: {
                category: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })
        return { success: true, data: gear }
    } catch (error) {
        console.error('Failed to fetch gear:', error)
        return { success: false, error: 'Failed to fetch gear' }
    }
}

export async function createGearItem(userId: string, data: {
    name: string
    brand?: string
    weightGrams?: number
    categoryId: string
    condition?: string
    imageUrl?: string
}) {
    try {
        if (data.weightGrams !== undefined && data.weightGrams < 0) {
            return { success: false, error: 'Weight cannot be negative' }
        }

        const newItem = await prisma.gearItem.create({
            data: {
                user: { connect: { id: userId } },
                name: data.name,
                brand: data.brand || null,
                weightGrams: data.weightGrams ?? null,
                category: { connect: { id: data.categoryId } },
                condition: (data.condition as any) || 'GOOD',
                imageUrl: data.imageUrl || null
            }
        })
        return { success: true, data: newItem }
    } catch (error) {
        console.error('Failed to create gear item:', error)
        return { success: false, error: 'Failed to create gear item' }
    }
}

export async function updateGearItem(gearId: string, userId: string, data: {
    name: string
    brand?: string
    weightGrams?: number
    categoryId: string
    condition?: string
    imageUrl?: string
}) {
    try {
        // Verify ownership
        const existing = await prisma.gearItem.findUnique({
            where: { id: gearId }
        })

        if (!existing || existing.userId !== userId) {
            return { success: false, error: 'Unauthorized or not found' }
        }

        if (data.weightGrams !== undefined && data.weightGrams < 0) {
            return { success: false, error: 'Weight cannot be negative' }
        }

        const updatedItem = await prisma.gearItem.update({
            where: { id: gearId },
            data: {
                name: data.name,
                brand: data.brand || null,
                weightGrams: data.weightGrams ?? null,
                categoryId: data.categoryId,
                condition: (data.condition as any) || 'GOOD',
                imageUrl: data.imageUrl || null
            }
        })
        return { success: true, data: updatedItem }
    } catch (error) {
        console.error('Failed to update gear item:', error)
        return { success: false, error: 'Failed to update gear item' }
    }
}

export async function deleteGearItem(gearId: string, userId: string) {
    try {
        const existing = await prisma.gearItem.findUnique({
            where: { id: gearId }
        })

        if (!existing || existing.userId !== userId) {
            return { success: false, error: 'Unauthorized or not found' }
        }

        await prisma.gearItem.delete({
            where: { id: gearId }
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to delete gear item:', error)
        return { success: false, error: 'Failed to delete gear item' }
    }
}
