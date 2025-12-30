'use client'

import { useState, useTransition } from 'react'
import { searchUsers, sendFriendRequest } from '@/app/actions/social'
import { ImageUpload } from '@/components/ui/ImageUpload' // Not actually using this here, but ensuring imports are clean

interface UserSearchProps {
    currentUserId: string
}

export function UserSearch({ currentUserId }: UserSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [isSearching, startTransition] = useTransition()
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

    const handleSearch = (val: string) => {
        setQuery(val)
        if (val.length < 2) {
            setResults([])
            return
        }

        startTransition(async () => {
            const res = await searchUsers(val, currentUserId)
            if (res.success && res.data) {
                setResults(res.data)
            }
        })
    }

    const handleAdd = async (userId: string) => {
        setPendingIds(prev => new Set(prev).add(userId))
        const res = await sendFriendRequest(currentUserId, userId)
        if (res.success) {
            // We just leave them as pending
        } else {
            alert('Failed to send request')
            setPendingIds(prev => {
                const newSet = new Set(prev)
                newSet.delete(userId)
                return newSet
            })
        }
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by username or email..."
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
                {isSearching && (
                    <div className="absolute right-3 top-2.5">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-600" />
                    </div>
                )}
            </div>

            {results.length > 0 && (
                <div className="rounded-md border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
                    {results.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-md">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-500">
                                            {user.username.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.fullName || user.username}</p>
                                    <p className="text-xs text-neutral-500">@{user.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAdd(user.id)}
                                disabled={pendingIds.has(user.id)}
                                className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                            >
                                {pendingIds.has(user.id) ? 'Sent' : 'Add Friend'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
