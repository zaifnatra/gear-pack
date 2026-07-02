'use server'

import * as tripGearService from '@/lib/services/tripGear'
import { revalidatePath } from 'next/cache'

export async function getTripGear(tripId: string) {
    return tripGearService.getTripGear(tripId)
}

export async function addGearToTrip(tripId: string, gearId: string, userId: string, isShared: boolean = false) {
    const result = await tripGearService.addGearToTrip(tripId, gearId, userId, isShared)
    if (result.success) revalidatePath(`/dashboard/trips/${tripId}`)
    return result
}

export async function togglePacked(tripGearId: string, isPacked: boolean) {
    return tripGearService.togglePacked(tripGearId, isPacked)
}

export async function removeGearFromTrip(tripGearId: string) {
    const result = await tripGearService.removeGearFromTrip(tripGearId)
    if (result.success && result.tripId) {
        revalidatePath(`/dashboard/trips/${result.tripId}`)
    }
    return { success: result.success, ...(result.error ? { error: result.error } : {}) }
}

export async function addMultipleGearToTrip(tripId: string, gearIds: string[], userId: string, isShared: boolean = false) {
    const result = await tripGearService.addMultipleGearToTrip(tripId, gearIds, userId, isShared)
    if (result.success) revalidatePath(`/dashboard/trips/${tripId}`)
    return result
}
