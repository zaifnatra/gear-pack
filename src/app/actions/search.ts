'use server'

import * as searchService from '@/lib/services/search'

export type SearchResult = searchService.SearchResult

export async function searchGlobal(query: string, currentUserId: string) {
    return searchService.searchGlobal(query, currentUserId)
}
