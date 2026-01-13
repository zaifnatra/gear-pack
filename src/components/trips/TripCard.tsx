'use client'

import { InviteFriendModal } from './InviteFriendModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTripWeather, TripWeather } from '@/app/actions/weather'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { updateTripImage } from '@/app/actions/trips'

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
    const router = useRouter()
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isEditImageOpen, setIsEditImageOpen] = useState(false)
    const [weather, setWeather] = useState<TripWeather | null>(null)
    const startDate = new Date(trip.startDate)
    const endDate = trip.endDate ? new Date(trip.endDate) : null
    const isOrganizer = trip.organizerId === currentUserId

    // Fetch Weather
    useEffect(() => {
        if (!trip.location) return

        const fetchWeather = async () => {
            const startStr = new Date(trip.startDate).toISOString().split('T')[0]
            const endStr = trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : startStr

            const res = await getTripWeather(trip.location!, startStr, endStr)
            if (res && !res.error) {
                setWeather(res)
            }
        }

        fetchWeather()
    }, [trip.location, trip.startDate, trip.endDate])

    const isSingleDay = !endDate || (startDate.toDateString() === endDate.toDateString())

    const dateRange = isSingleDay
        ? startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })
        : `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

    const durationMs = endDate ? endDate.getTime() - startDate.getTime() : 0
    const days = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + (isSingleDay ? 0 : 1))

    return (
        <>
            <div className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                <Link href={`/dashboard/trips/${trip.id}`} className="block">
                    <div className="h-32 w-full bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                        {/* Custom Image or Placeholder Gradient */}
                        {(trip as any).imageUrl ? (
                            <img src={(trip as any).imageUrl} alt={trip.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 dark:from-emerald-900/20 dark:to-blue-900/20`}></div>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 z-10">
                            <h3 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100 drop-shadow-sm bg-white/50 dark:bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md inline-block mb-1">{trip.name}</h3>
                            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md w-fit">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                {trip.location || 'No Location'}
                            </div>
                        </div>

                        {isOrganizer && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEditImageOpen(true)
                                }}
                                className="absolute top-2 right-2 z-20 rounded-full bg-white/80 p-1.5 text-neutral-700 hover:bg-white hover:text-emerald-600 shadow-sm backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                title="Change Cover Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                    {dateRange}
                                </span>
                                {/* Weather Badge (renders only if data loaded) */}
                                <WeatherBadge weather={weather} />
                            </div>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800 self-start">
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

            {
                isEditImageOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-neutral-900 shadow-xl">
                            <h3 className="text-lg font-bold mb-4">Change Trip Image</h3>
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
                                className="w-full rounded-md border border-neutral-200 py-2 font-medium hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
        </>
    )
}

function WeatherBadge({ weather }: { weather: TripWeather | null }) {
    if (!weather || weather.error) return null

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-blue-50/50 dark:bg-blue-900/10 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-900/30">
            {/* Condition Icon (Simple fallback) */}
            <span>{weather.condition?.includes('Rain') || weather.condition?.includes('Drizzle') ? '🌧️' :
                weather.condition?.includes('Snow') ? '❄️' :
                    weather.condition?.includes('Cloud') || weather.condition?.includes('Overcast') ? '☁️' : '☀️'}</span>

            <span>{Math.round(weather.tempMin || 0)}° - {Math.round(weather.tempMax || 0)}°C</span>

            {weather.precipProb && weather.precipProb > 20 && (
                <span className="text-blue-600 dark:text-blue-400 flex items-center">
                    <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    {weather.precipProb}%
                </span>
            )}
        </div>
    )
}
