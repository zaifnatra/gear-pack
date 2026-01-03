'use server'

import { prisma } from '@/lib/prisma'

export type SearchResult = {
    type: 'user' | 'trip'
    id: string
    title: string
    subtitle: string | null
    image: string | null
    url: string
}

export async function searchGlobal(query: string, currentUserId: string): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
    if (!query || query.length < 2) {
        return { success: true, results: [] }
    }

    try {
        const [users, trips] = await Promise.all([
            // Search Users
            prisma.user.findMany({
                where: {
                    OR: [
                        { username: { contains: query, mode: 'insensitive' } },
                        { fullName: { contains: query, mode: 'insensitive' } },
                    ],
                    NOT: { id: currentUserId }
                },
                take: 5,
                select: { id: true, username: true, fullName: true, avatarUrl: true }
            }),
            // Search Trips (Public or Friend's)
            prisma.trip.findMany({
                where: {
                    name: { contains: query, mode: 'insensitive' },
                    visibility: { not: 'PRIVATE' } // simplistic check, ideally check friendship for friends_only
                },
                take: 5,
                select: { id: true, name: true, location: true, type: true }
            })
        ])

        const results: SearchResult[] = [
            ...users.map(u => ({
                type: 'user' as const,
                id: u.id,
                title: u.fullName || u.username,
                subtitle: `@${u.username}`,
                image: u.avatarUrl,
                url: `/dashboard/social/${u.id}/closet`
            })),
            ...trips.map(t => ({
                type: 'trip' as const,
                id: t.id,
                title: t.name,
                subtitle: t.location,
                image: null,
                url: `/dashboard/trips/${t.id}`
            }))
        ]

        return { success: true, results }
    } catch (error) {
        console.error('Search failed:', error)
        return { success: false, error: 'Search failed' }
    }
}
