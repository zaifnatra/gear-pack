'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTrip } from '@/app/actions/trips'

interface TripActionsProps {
    tripId: string
    currentUserId: string
    organizerId: string
}

export function TripActions({ tripId, currentUserId, organizerId }: TripActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const isOrganizer = currentUserId === organizerId

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this trip? This cannot be undone.')) {
            return
        }

        startTransition(async () => {
            const res = await deleteTrip(tripId, currentUserId)
            if (res.success) {
                router.push('/dashboard/trips')
                router.refresh()
            } else {
                alert(res.error || 'Failed to delete trip')
            }
        })
    }

    return (
        <div className="flex flex-col gap-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
                Invite Friends
            </button>

            {isOrganizer && (
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                    {isPending ? 'Deleting...' : 'Delete Trip'}
                </button>
            )}
        </div>
    )
}
