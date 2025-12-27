'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TripCard } from '@/components/trips/TripCard'
import { Trip } from '@prisma/client'
import { Modal } from '@/components/ui/Modal'
import { CreateTripModal } from '@/components/trips/CreateTripModal'

interface TripDashboardViewProps {
    initialTrips: any[]
    userId: string
}

export function TripDashboardView({ initialTrips, userId }: TripDashboardViewProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const router = useRouter()

    const handleSuccess = () => {
        setIsCreateModalOpen(false)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Trips</h1>
                    <p className="text-neutral-500">Plan your next adventure.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Plan New Trip
                </button>
            </div>

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
                        <TripCard key={trip.id} trip={trip} />
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
