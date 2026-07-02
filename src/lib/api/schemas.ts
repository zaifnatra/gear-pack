import { Condition, Difficulty, TripType, TripVisibility } from '@prisma/client'
import { z } from 'zod'

export const GearSchema = z.object({
    name: z.string().min(1).max(100),
    brand: z.string().max(100).optional(),
    weightGrams: z.number().int().min(0).optional(),
    categoryId: z.string().min(1),
    condition: z.enum(Condition).optional(),
    imageUrl: z.string().url().optional(),
})

export const TripSchema = z.object({
    name: z.string().min(1).max(120),
    location: z.string().max(200).optional(),
    startDate: z.string().min(1),
    endDate: z.string().optional(),
    type: z.enum(TripType),
    difficulty: z.enum(Difficulty),
    distance: z.number().min(0).optional(),
    elevationGain: z.number().min(0).optional(),
    description: z.string().max(2000).optional(),
    externalUrl: z.string().url().optional(),
    visibility: z.enum(TripVisibility).optional(),
})
