// src/types/gear.ts

export interface CategoryData {
    id: string
    name: string
    parentId?: string | null
    children?: CategoryData[]
}

export interface GearItemData {
    id: string
    name: string
    brand?: string | null
    weightGrams?: number | null
    categoryId: string
    condition: string
    imageUrl?: string | null
}
