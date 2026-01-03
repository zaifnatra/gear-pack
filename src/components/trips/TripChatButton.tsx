'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getOrCreateTripConversation } from '@/app/actions/messages'
import { toast } from 'sonner'

interface TripChatButtonProps {
    tripId: string
    currentUserId: string
}

export function TripChatButton({ tripId, currentUserId }: TripChatButtonProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleOpenChat = () => {
        startTransition(async () => {
            const res = await getOrCreateTripConversation(tripId, currentUserId)
            if (res.success && res.conversationId) {
                router.push(`/dashboard/messages?id=${res.conversationId}`)
            } else {
                toast.error(res.error || 'Failed to open chat')
            }
        })
    }

    return (
        <button
            onClick={handleOpenChat}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            {isPending ? 'Opening...' : 'Group Chat'}
        </button>
    )
}
