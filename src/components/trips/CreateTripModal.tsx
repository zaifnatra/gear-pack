'use client'

import { useState, useTransition } from 'react'
import { createTrip } from '@/app/actions/trips'
import { useRouter } from 'next/navigation'
import { TripType, Difficulty } from '@prisma/client'
import { POPULAR_TRAILS, TrailTemplate } from '@/data/popularTrails'

const TRIP_TYPES = ['DAY_HIKE', 'OVERNIGHT', 'MULTI_DAY', 'THRU_HIKE', 'OTHER']
const DIFFICULTIES = ['EASY', 'MODERATE', 'HARD', 'EXTREME']

interface CreateTripModalProps {
    userId: string
    onSuccess: () => void
}

export function CreateTripModal({ userId, onSuccess }: CreateTripModalProps) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [name, setName] = useState('')
    const [location, setLocation] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [type, setType] = useState('OVERNIGHT')
    const [difficulty, setDifficulty] = useState('MODERATE')
    const [distance, setDistance] = useState('')
    const [elevation, setElevation] = useState('')
    const [description, setDescription] = useState('')
    const [externalUrl, setExternalUrl] = useState('')

    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TrailTemplate[]>([])

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (query.length > 2) {
            const results = POPULAR_TRAILS.filter(t =>
                t.name.toLowerCase().includes(query.toLowerCase()) ||
                t.location.toLowerCase().includes(query.toLowerCase())
            )
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }

    const selectTrail = (trail: TrailTemplate) => {
        setName(trail.name)
        setLocation(trail.location)
        setType(trail.type)
        setDifficulty(trail.difficulty)
        setDistance(trail.distance.toString())
        setElevation(trail.elevationGain.toString())
        setDescription(trail.description || '')
        setSearchResults([])
        setSearchQuery('')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const res = await createTrip(userId, {
                name,
                location,
                startDate,
                endDate: endDate || undefined,
                type: type as TripType,
                difficulty: difficulty as Difficulty,
                distance: distance ? parseFloat(distance) : undefined,
                elevationGain: elevation ? parseInt(elevation) : undefined,
                description,
                externalUrl: externalUrl || undefined,
                visibility: 'FRIENDS_ONLY'
            })

            if (res.success) {
                onSuccess()
                router.refresh()
            } else {
                alert('Failed to create trip')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative z-50">
                <label className="text-xs font-semibold uppercase text-neutral-500">Select a Route</label>
                <div className="relative mt-1">
                    <input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200"
                        placeholder="Search routes (e.g. 'Mount Washington')..."
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                            {searchResults.map((trail) => (
                                <button
                                    key={trail.name}
                                    type="button"
                                    onClick={() => selectTrail(trail)}
                                    className="flex w-full flex-col items-start rounded-sm px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{trail.name}</span>
                                    <span className="text-xs text-neutral-500">{trail.location} • {trail.distance}km</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Trail Summary or Placeholder */}
            {name ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{name}</h3>
                            <div className="text-xs text-neutral-500 flex items-center mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {location}
                            </div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                                difficulty === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                            }`}>
                            {difficulty}
                        </div>
                    </div>
                    <div className="flex gap-4 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                        <div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">{distance} km</span>
                            <span className="text-xs ml-1 text-neutral-500">Distance</span>
                        </div>
                        <div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">{elevation} m</span>
                            <span className="text-xs ml-1 text-neutral-500">Elevation</span>
                        </div>
                        <div>
                            <span className="font-medium text-neutral-900 dark:text-neutral-200">{type.replace('_', ' ')}</span>
                            <span className="text-xs ml-1 text-neutral-500">Type</span>
                        </div>
                    </div>

                    {/* Hidden Inputs to submit the form data properly */}
                    {/* We no longer render editable inputs for these stats */}
                </div>
            ) : (
                <div className="py-8 text-center text-sm text-neutral-500 border-2 border-dashed border-neutral-200 rounded-lg dark:border-neutral-800">
                    Search and select a route above to plan your trip.
                </div>
            )}

            {/* Only show Date selection if a trip is selected */}
            {name && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="Rough plan, meeting points, etc."
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">AllTrails Link (Optional)</label>
                <input
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="https://www.alltrails.com/trail/..."
                />
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isPending || !name}
                    className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:bg-neutral-400"
                >
                    {isPending ? 'Plan Trip...' : 'Create Trip'}
                </button>
            </div>
        </form>
    )
}
