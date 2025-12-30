'use client'

import { InviteFriendModal } from './InviteFriendModal'
import { useState } from 'react'
import Link from 'next/link'

interface TripCardProps {
    trip: {
        id: string
        name: string
        location: string | null
        startDate: Date | string
        endDate: Date | string | null
        type: string
        difficulty: string
        distance: number | null
        elevationGain: number | null
        organizerId: string
        participants: { user: { id: string; fullName: string | null; avatarUrl: string | null } }[]
        _count: {
            gearList: number
        }
    }
    currentUserId: string
}

export function TripCard({ trip, currentUserId }: TripCardProps) {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const startDate = new Date(trip.startDate)
    const endDate = trip.endDate ? new Date(trip.endDate) : null
    const isOrganizer = trip.organizerId === currentUserId

    const dateRange = endDate
        ? `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
        : startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })

    const days = endDate
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1

    return (
        <>
            <div className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Link href={`/dashboard/trips/${trip.id}`} className="block">
                    <div className="h-32 w-full bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                        {/* Placeholder Cover - Could be a random gradient or image later */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 dark:from-emerald-900/20 dark:to-blue-900/20`}></div>

                        <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100">{trip.name}</h3>
                            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                {trip.location || 'No Location'}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                            <span className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                {dateRange}
                            </span>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                                {days} Day{days > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="flex gap-2 mb-4 flex-wrap">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20">
                                {trip.type.replace('_', ' ')}
                            </span>
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${trip.difficulty === 'EASY' ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-400/20' :
                                trip.difficulty === 'MODERATE' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-400/20' :
                                    'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-400/20'
                                }`}>
                                {trip.difficulty}
                            </span>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                            <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <div title="Distance" className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
                                    {trip.distance ? `${trip.distance}km` : '-'}
                                </div>
                                <div title="Elevation" className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>
                                    {trip.elevationGain ? `${trip.elevationGain}m` : '-'}
                                </div>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                {trip.participants.length}
                            </div>
                        </div>
                    </div>
                </Link>
                {isOrganizer && (
                    <div className="border-t border-neutral-100 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsInviteModalOpen(true)
                            }}
                            className="flex w-full items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-3.5 w-3.5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                            Invite Friends
                        </button>
                    </div>
                )}
            </div>

            <InviteFriendModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                tripId={trip.id}
                currentUserId={currentUserId}
            />
        </>
    )
}
