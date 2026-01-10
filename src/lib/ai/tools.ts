import { prisma } from "@/lib/prisma"
import { TripType, Difficulty } from "@prisma/client"
import {
    applyPreferenceUpdates,
    normalizePreferenceStore
} from "@/lib/ai/preferences"
import type { PreferenceKey, PreferenceUpdate } from "@/lib/ai/preferences"

// Tool 1: Create Trip
interface CreateTripParams {
    name: string
    location: string
    startDate: string // ISO string
    endDate: string // ISO string
    type: TripType
    difficulty: Difficulty
    distance: number
    elevationGain: number
    description: string
    externalUrl?: string
    latitude?: number
    longitude?: number
}

export async function createTrip(userId: string, params: CreateTripParams) {
    try {
        const trip = await prisma.trip.create({
            data: {
                name: params.name,
                location: params.location,
                startDate: new Date(params.startDate),
                endDate: new Date(params.endDate),
                type: params.type,
                difficulty: params.difficulty,
                distance: params.distance,
                elevationGain: params.elevationGain,
                description: params.description,
                externalUrl: params.externalUrl,
                latitude: params.latitude,
                longitude: params.longitude,
                organizerId: userId,
                // Automatically add organizer as participant
                participants: {
                    create: {
                        userId: userId,
                        role: 'ORGANIZER',
                        status: 'ACCEPTED'
                    }
                }
            }
        })
        return { success: true, tripId: trip.id, message: `Trip "${trip.name}" created successfully!` }
    } catch (error) {
        console.error("Tool Error: createTrip", error)
        return { success: false, error: "Failed to create trip in database." }
    }
}

// Tool 2: Get User Gear
export async function getUserGear(userId: string) {
    try {
        const gear = await prisma.gearItem.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { category: { name: 'asc' } }
        })

        // Format for AI to save tokens/complexity
        return gear.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category.name,
            weight: item.weightGrams ? `${item.weightGrams}g` : 'N/A',
            tempRating: item.tempRating ? `${item.tempRating}F` : undefined,
            condition: item.condition
        }))
    } catch (error) {
        console.error("Tool Error: getUserGear", error)
        return { success: false, error: "Failed to fetch gear." }
    }
}

// Tool 3: Add Gear to Trip
interface AddGearParams {
    tripId: string
    gearItems: {
        gearId: string
        quantity?: number
        isShared?: boolean
        carriedById?: string
    }[]
}

export async function addGearToTrip(params: AddGearParams) {
    try {
        let count = 0
        for (const item of params.gearItems) {
            let gearId: string | undefined
            let quantity = 1
            let isShared = false
            let carriedById: string | undefined = undefined

            // Robustness: AI might send just a string ID
            if (typeof item === 'string') {
                gearId = item
            } else {
                gearId = item.gearId
                quantity = item.quantity || 1
                isShared = item.isShared || false
                carriedById = item.carriedById
            }

            if (!gearId) {
                console.warn("Skipping gear item with missing ID", item)
                continue
            }

            await prisma.tripGear.create({
                data: {
                    tripId: params.tripId,
                    gearId: gearId,
                    quantity: quantity,
                    isShared: isShared,
                    carriedById: carriedById,
                    isPacked: false
                }
            })
            count++
        }
        return { success: true, count, message: `Added ${count} items to trip.` }
    } catch (error) {
        console.error("Tool Error: addGearToTrip", error)
        return { success: false, error: "Failed to add gear to trip." }
    }
}
// Tool 4: Get User Profile
export async function getUserProfile(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                fullName: true,
                location: true,
                preferences: true
            }
        })

        if (!user) return null

        const { store, changed } = normalizePreferenceStore(user.preferences)
        if (changed) {
            await prisma.user.update({
                where: { id: userId },
                data: { preferences: store }
            })
        }

        // Format for AI (stable preferences only)
        return {
            name: user.fullName || "User",
            location: user.location || "Unknown",
            preferences: store.profile
        }
    } catch (e) {
        console.error("Error fetching user profile:", e)
        return null
    }
}

/**
 * Tool 5: Update User Preferences (stored in User.preferences JSON)
 *
 * Supports confidence + conflict logging:
 * - If existing confidence is "confirmed" and a different value arrives, it is NOT overwritten.
 * - A conflict record is appended instead.
 */
export async function updateUserPreferences(
    userId: string,
    params: { updates: Array<{ key: PreferenceKey; value: string; confidence: "default" | "inferred" | "confirmed"; evidence?: string }> }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        })

        const { store } = normalizePreferenceStore(user?.preferences)
        const updates: PreferenceUpdate[] = Array.isArray(params?.updates) ? params.updates : []
        const { store: nextStore, applied, conflictsAdded } = applyPreferenceUpdates(store, updates)

        await prisma.user.update({
            where: { id: userId },
            data: { preferences: nextStore }
        })

        return {
            success: true,
            applied,
            conflictsAdded,
            preferences: nextStore.profile,
            message: applied.length > 0 ? "Saved your preferences for next time." : "No changes were made."
        }
    } catch (e) {
        console.error("Tool Error: updateUserPreferences", e)
        return { success: false, error: "Failed to update user preferences." }
    }
}
