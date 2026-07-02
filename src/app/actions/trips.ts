'use server'

import * as tripsService from '@/lib/services/trips'
import type { TripInput } from '@/lib/services/trips'
import { revalidatePath } from 'next/cache'

export async function createTrip(userId: string, data: TripInput) {
    return tripsService.createTrip(userId, data)
}

export async function inviteUserToTrip(tripId: string, friendId: string, performerId: string) {
    const result = await tripsService.inviteUserToTrip(tripId, friendId, performerId)
    if (result.success) {
        revalidatePath('/dashboard') // notification badge
        revalidatePath('/dashboard/trips')
    }
    return result
}

export async function respondToTripInvite(tripId: string, userId: string, status: 'ACCEPTED' | 'DECLINED') {
    const result = await tripsService.respondToTripInvite(tripId, userId, status)
    if (result.success) {
        revalidatePath('/dashboard') // notification badge
        revalidatePath('/dashboard/trips')
    }
    return result
}

export async function getTripInvites(userId: string) {
    return tripsService.getTripInvites(userId)
}

export async function getTrips(userId: string) {
    return tripsService.getTrips(userId)
}

export async function getTrip(tripId: string) {
    return tripsService.getTrip(tripId)
}

export async function deleteTrip(tripId: string, userId: string) {
    return tripsService.deleteTrip(tripId, userId)
}

export async function getFriendTrips(userId: string) {
    return tripsService.getFriendTrips(userId)
}

export async function updateTripImage(tripId: string, imageUrl: string, userId: string) {
    const result = await tripsService.updateTripImage(tripId, imageUrl, userId)
    if (result.success) revalidatePath('/dashboard/trips')
    return result
}
