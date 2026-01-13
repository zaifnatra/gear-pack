'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TripCard } from '@/components/trips/TripCard'
import { Trip } from '@prisma/client'
import { Modal } from '@/components/ui/Modal'
import { CreateTripModal } from '@/components/trips/CreateTripModal'
import { respondToTripInvite } from '@/app/actions/trips'
import { toast } from 'sonner'

interface TripDashboardViewProps {
    initialTrips: any[]
    invites: any[]
    userId: string
}

export function TripDashboardView({ initialTrips, invites, userId }: TripDashboardViewProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSuccess = () => {
        setIsCreateModalOpen(false)
        router.refresh()
    }

    const handleInviteResponse = (tripId: string, status: 'ACCEPTED' | 'DECLINED') => {
        startTransition(async () => {
            const res = await respondToTripInvite(tripId, userId, status)
            if (res.success) {
                toast.success(status === 'ACCEPTED' ? 'Joined trip!' : 'Declined invitation')
                router.refresh()
            } else {
                toast.error(res.error || 'Failed to respond')
            }
        })
    }

    // Auto-refresh to catch AI created trips
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh()
        }, 5000) // Refresh every 5s to catch new trips
        return () => clearInterval(interval)
    }, [router])

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-2xl shadow-black/20 min-h-[250px] flex flex-col justify-end group">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/header2.jpg"
                        alt="Trips Background"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-heading tracking-tight drop-shadow-sm mb-2">Your Expeditions</h1>
                        <p className="text-neutral-200 text-lg font-medium drop-shadow-sm max-w-xl">
                            Plan your next adventure, invite friends, and coordinate logistics.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-full bg-white text-neutral-900 px-6 py-3 font-bold text-sm hover:bg-neutral-100 hover:scale-105 transition-all shadow-lg shadow-black/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Plan New Trip
                    </button>
                </div>
            </div>

            {/* Invites Section */}
            {invites.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Pending Invitations</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {invites.map((trip) => (
                            <div key={trip.id} className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{trip.name}</h3>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                                            <div className="h-5 w-5 overflow-hidden rounded-full bg-neutral-200">
                                                {trip.organizer.avatarUrl ? (
                                                    <img src={trip.organizer.avatarUrl} alt={trip.organizer.username} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium">
                                                        {trip.organizer.username.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span>Invited by {trip.organizer.fullName || trip.organizer.username}</span>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        Invited
                                    </span>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleInviteResponse(trip.id, 'ACCEPTED')}
                                        disabled={isPending}
                                        className="flex-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleInviteResponse(trip.id, 'DECLINED')}
                                        disabled={isPending}
                                        className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {initialTrips.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <p className="text-sm text-neutral-500">No upcoming trips.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Start Planning
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {initialTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} currentUserId={userId} />
                    ))}
                </div>
            )}

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Plan New Trip"
            >
                <CreateTripModal userId={userId} onSuccess={handleSuccess} />
            </Modal>
        </div>
    )
}
