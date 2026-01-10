import { prisma } from "@/lib/prisma"
import { TripType, Difficulty } from "@prisma/client"

type SleepTempPreference = "WARM" | "COLD"
type PackStylePreference = "ULTRALIGHT" | "COMFORT"
type ExperiencePreference = "BEGINNER" | "INTERMEDIATE" | "EXPERT"

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

        // Format for AI
        return {
            name: user.fullName || "User",
            location: user.location || "Unknown",
            preferences: user.preferences || "Unknown (Ask the user for their sleeping temperature (Warm/Cold) and packing style (Ultralight/Comfort))"
        }
    } catch (e) {
        console.error("Error fetching user profile:", e)
        return null
    }
}

interface UpdateUserPreferencesParams {
    sleepTemp?: SleepTempPreference | string
    packStyle?: PackStylePreference | string
    experience?: ExperiencePreference | string
}

function normalizePreference(
    value: unknown,
    allowed: readonly string[],
    aliases: Record<string, string> = {}
): string | undefined {
    if (typeof value !== "string") return undefined
    const raw = value.trim()
    if (!raw) return undefined

    const upper = raw.toUpperCase()
    const aliased = aliases[upper] || upper
    return allowed.includes(aliased) ? aliased : undefined
}

/**
 * Tool 5: Update User Preferences (stored in User.preferences JSON)
 * This lets the assistant persist user preferences across conversations.
 */
export async function updateUserPreferences(userId: string, params: UpdateUserPreferencesParams) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        })

        const existingPreferences = user?.preferences
        const current =
            existingPreferences && typeof existingPreferences === "object" && !Array.isArray(existingPreferences)
                ? (existingPreferences as Record<string, unknown>)
                : {}

        const next: Record<string, unknown> = { ...current }

        const sleepTemp = normalizePreference(params.sleepTemp, ["WARM", "COLD"])
        if (sleepTemp) next.sleepTemp = sleepTemp

        const packStyle = normalizePreference(params.packStyle, ["ULTRALIGHT", "COMFORT"], {
            UL: "ULTRALIGHT",
            LIGHT: "ULTRALIGHT",
            LIGHTWEIGHT: "ULTRALIGHT",
            COMFY: "COMFORT"
        })
        if (packStyle) next.packStyle = packStyle

        const experience = normalizePreference(params.experience, ["BEGINNER", "INTERMEDIATE", "EXPERT"], {
            ADVANCED: "EXPERT"
        })
        if (experience) next.experience = experience

        await prisma.user.update({
            where: { id: userId },
            data: { preferences: next }
        })

        return {
            success: true,
            preferences: next,
            message: "Saved your preferences for next time."
        }
    } catch (e) {
        console.error("Tool Error: updateUserPreferences", e)
        return { success: false, error: "Failed to update user preferences." }
    }
}
