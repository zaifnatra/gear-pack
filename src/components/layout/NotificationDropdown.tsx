'use client'

import { useState, useEffect, useRef } from 'react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/app/actions/notifications'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

interface NotificationDropdownProps {
    userId: string
}

export function NotificationDropdown({ userId }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Refresh on pathname change (navigation)
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Fetch data logic
    const fetchData = async () => {
        const [notifsRes, countRes] = await Promise.all([
            getNotifications(userId),
            getUnreadCount(userId)
        ])

        if (notifsRes.success) setNotifications(notifsRes.data || [])
        if (countRes.success) setUnreadCount(countRes.count || 0)
    }

    // Initial load and polling
    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [userId])

    // Refetch when opening to ensure fresh data
    useEffect(() => {
        if (isOpen) fetchData()
    }, [isOpen])

    const handleMarkAllRead = async () => {
        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
        await markAllAsRead(userId)
    }

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            // Optimistic
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
            await markAsRead(notification.id)
        }
        setIsOpen(false)
    }

    // Helper for icons based on type
    const getIcon = (type: string) => {
        switch (type) {
            case 'FRIEND_REQUEST':
                return (
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                    </div>
                )
            case 'TRIP_INVITE':
                return (
                    <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                    </div>
                )
            default:
                return (
                    <div className="rounded-full bg-neutral-100 p-2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </div>
                )
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800"
            >
                <span className="sr-only">Notifications</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>

                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 z-50">
                    <div className="flex items-center justify-between border-b border-neutral-100 p-4 dark:border-neutral-800">
                        <h3 className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
                                <p className="text-sm">No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!notification.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm text-neutral-900 dark:text-neutral-200 leading-snug">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-neutral-400">
                                                    {new Date(notification.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {notification.link && (
                                                    <>
                                                        <span className="text-neutral-300 dark:text-neutral-700">•</span>
                                                        <Link
                                                            href={notification.link}
                                                            onClick={(e) => {
                                                                // Allow default navigation but mark read
                                                                handleNotificationClick(notification)
                                                            }}
                                                            className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                                                        >
                                                            View
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0 mt-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
