'use server'

import * as categoriesService from '@/lib/services/categories'

export async function getCategories() {
    return categoriesService.getCategories()
}
