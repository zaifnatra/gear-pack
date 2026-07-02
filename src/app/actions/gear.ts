'use server'

import * as gearService from '@/lib/services/gear'
import type { GearItemInput } from '@/lib/services/gear'

export async function getGearItems(userId: string) {
    return gearService.getGearItems(userId)
}

export async function createGearItem(userId: string, data: GearItemInput) {
    return gearService.createGearItem(userId, data)
}

export async function updateGearItem(gearId: string, userId: string, data: GearItemInput) {
    return gearService.updateGearItem(gearId, userId, data)
}

export async function deleteGearItem(gearId: string, userId: string) {
    return gearService.deleteGearItem(gearId, userId)
}
