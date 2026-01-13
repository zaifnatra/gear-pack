'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { updateTripImage } from '@/app/actions/trips'

export function TripDetailsHeader({ trip, currentUserId }: { trip: any; currentUserId: string }) {
    const router = useRouter()
    const [isEditImageOpen, setIsEditImageOpen] = useState(false)

    // Parse dates ensuring timezone safety
    const startDate = new Date(trip.startDate)
    const endDate = trip.endDate ? new Date(trip.endDate) : null

    // Check if dates are the same day (ignoring time)
    const isSingleDay = !endDate || (startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0])

    const dateRange = isSingleDay
        ? startDate.toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' }) // Use UTC to avoid shift
        : `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} - ${endDate!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`

    const durationMs = endDate ? endDate.getTime() - startDate.getTime() : 0
    // Add logic to fix the "1 days" issue
    let days = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1
    if (isSingleDay) days = 1

    const isOrganizer = trip.organizerId === currentUserId

    return (
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-neutral-900 group">
            {/* Edit Button */}
            {isOrganizer && (
                <button
                    onClick={() => setIsEditImageOpen(true)}
                    className="absolute top-4 right-4 z-30 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                    title="Change Cover Image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                </button>
            )}

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black/60 z-10 transition-opacity"></div>

            {/* Image */}
            {trip.imageUrl ? (
                <img src={trip.imageUrl} alt={trip.name} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50 block"></div>
            )}

            <div className="absolute bottom-6 left-6 z-20 text-white">
                <div className="flex gap-2 mb-2">
                    <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-1 text-xs font-medium backdrop-blur-md">
                        {trip.type.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium backdrop-blur-md ${trip.difficulty === 'EASY' ? 'bg-green-500/30 text-green-100' :
                        trip.difficulty === 'MODERATE' ? 'bg-yellow-500/30 text-yellow-100' :
                            'bg-red-500/30 text-red-100'
                        }`}>
                        {trip.difficulty}
                    </span>
                </div>
                <h1 className="text-3xl font-bold drop-shadow-md">{trip.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-neutral-200">
                    <span className="flex items-center gap-1 drop-shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        {trip.location || 'Unknown Location'}
                    </span>
                    <span className="flex items-center gap-1 drop-shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        {dateRange} ({days} Day{days !== 1 ? 's' : ''})
                    </span>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditImageOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900 shadow-xl relative z-50">
                        <h3 className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">Change Trip Cover</h3>
                        <div className="flex justify-center mb-6">
                            <ImageUpload onUploadComplete={async (url) => {
                                if (url) {
                                    await updateTripImage(trip.id, url, currentUserId)
                                    setIsEditImageOpen(false)
                                    router.refresh()
                                }
                            }} />
                        </div>
                        <button
                            onClick={() => setIsEditImageOpen(false)}
                            className="w-full rounded-md border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 dark:text-white text-neutral-900"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
