'use server'

import { prisma } from '@/lib/prisma'

export async function getCategories() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                parentId: null // Top level
            },
            include: {
                children: true
            }
        })
        return { success: true, data: categories }
    } catch (error) {
        console.error('Failed to fetch categories:', error)
        return { success: false, error: 'Failed to fetch categories' }
    }
}
