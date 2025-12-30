'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { inviteUserToTrip } from '@/app/actions/trips'
import { getFriends } from '@/app/actions/social'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface InviteFriendModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    currentUserId: string
}

export function InviteFriendModal({ isOpen, onClose, tripId, currentUserId }: InviteFriendModalProps) {
    const [friends, setFriends] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [inviting, setInviting] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            loadFriends()
        }
    }, [isOpen])

    async function loadFriends() {
        setLoading(true)
        const res = await getFriends(currentUserId)
        if (res.success && res.data) {
            setFriends(res.data)
        }
        setLoading(false)
    }

    async function handleInvite(friendId: string) {
        setInviting(friendId)
        try {
            const res = await inviteUserToTrip(tripId, friendId, currentUserId)
            if (res.success) {
                toast.success('Invitation sent!')
                router.refresh()
            } else {
                toast.error(res.error || 'Failed to send invitation')
            }
        } catch (error) {
            toast.error('Something went wrong')
        } finally {
            setInviting(null)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Invite Friends">
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center text-sm text-neutral-500">Loading friends...</div>
                ) : friends.length === 0 ? (
                    <div className="text-center text-sm text-neutral-500">
                        You have no friends to invite. <br />
                        <span className="text-xs">Go to Social Hub to add friends.</span>
                    </div>
                ) : (
                    <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
                        {friends.map((friend) => (
                            <div key={friend.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                        {friend.avatarUrl ? (
                                            <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-medium text-neutral-500">
                                                {friend.username.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{friend.fullName || friend.username}</span>
                                        <span className="text-xs text-neutral-500">@{friend.username}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleInvite(friend.id)}
                                    disabled={!!inviting}
                                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {inviting === friend.id ? 'Sending...' : 'Invite'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}
