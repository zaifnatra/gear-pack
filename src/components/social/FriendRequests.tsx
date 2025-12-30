'use client'

import { useTransition } from 'react'
import { respondToFriendRequest } from '@/app/actions/social'
import { useRouter } from 'next/navigation'

interface FriendRequestsProps {
    requests: any[]
}

export function FriendRequests({ requests }: FriendRequestsProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    if (!requests || requests.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
                No pending requests.
            </div>
        )
    }

    const handleRespond = (requestId: string, status: 'ACCEPTED' | 'DECLINED') => {
        startTransition(async () => {
            const res = await respondToFriendRequest(requestId, status)
            if (res.success) {
                router.refresh()
            } else {
                alert('Failed to respond')
            }
        })
    }

    return (
        <div className="space-y-4">
            {requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            {req.user.avatarUrl ? (
                                <img src={req.user.avatarUrl} alt={req.user.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
                                    {req.user.username.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{req.user.fullName || req.user.username}</p>
                            <p className="text-xs text-neutral-500">@{req.user.username}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleRespond(req.id, 'DECLINED')}
                            disabled={isPending}
                            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
                        >
                            Decline
                        </button>
                        <button
                            onClick={() => handleRespond(req.id, 'ACCEPTED')}
                            disabled={isPending}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            Accept
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
