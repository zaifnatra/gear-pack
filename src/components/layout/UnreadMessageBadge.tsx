'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUnreadMessageCount } from '@/app/actions/messages'

interface UnreadMessageBadgeProps {
    userId: string
}

export function UnreadMessageBadge({ userId }: UnreadMessageBadgeProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const pathname = usePathname()

    const fetchCount = async () => {
        const res = await getUnreadMessageCount(userId)
        if (res.success) {
            setUnreadCount(res.count)
        }
    }

    // Initial load and polling
    useEffect(() => {
        fetchCount()
        const interval = setInterval(fetchCount, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [userId])

    // Refresh on navigation (e.g. going to messages should eventually clear it, 
    // but the clear logic happens inside the chat page)
    useEffect(() => {
        fetchCount()
    }, [pathname])

    return (
        <Link
            href="/dashboard/messages"
            className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800"
        >
            <span className="sr-only">Messages</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>

            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    )
}
