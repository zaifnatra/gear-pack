'use client'

import { useState, useTransition } from 'react'
import { createTrip } from '@/app/actions/trips'
import { useRouter, usePathname } from 'next/navigation'
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
    const pathname = usePathname()

    // Mode: 'SPLASH' | 'MANUAL'
    const [mode, setMode] = useState<'SPLASH' | 'MANUAL'>('SPLASH')

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

    if (mode === 'SPLASH') {
        return (
            <div className="flex flex-col gap-6 py-4">
                <div className="text-center space-y-2">
                    <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Let PackBot Do the Work</h3>
                    <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Our AI assistant can find trails, check weather, and create the perfect itinerary for you in seconds.
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => {
                            router.push(pathname + '?chat=open')
                            onSuccess()
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Plan with Packbot
                    </button>

                    <button
                        onClick={() => setMode('MANUAL')}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        Plan Trip Manually
                    </button>
                    <p className="text-xs text-center text-neutral-400">
                        Close this modal to find the AI chat in the bottom right.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-lg font-semibold">Manual Trip Plan</h3>
                <button
                    type="button"
                    onClick={() => setMode('SPLASH')}
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                >
                    Back to AI
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Trip Name</label>
                    <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="e.g. Mount Washington Day Hike"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="e.g. New Hampshire, USA"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Distance (km)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={distance}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (val >= 0 || e.target.value === '') setDistance(e.target.value)
                            }}
                            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                            placeholder="0.0"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Elevation (m)</label>
                        <input
                            type="number"
                            min="0"
                            value={elevation}
                            onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (val >= 0 || e.target.value === '') setElevation(e.target.value)
                            }}
                            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                            placeholder="0"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Trip Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            {TRIP_TYPES.map(t => (
                                <option key={t} value={t}>{t.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Difficulty</label>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            {DIFFICULTIES.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

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
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isPending || !name}
                    className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:bg-neutral-400"
                >
                    {isPending ? 'Creating Trip...' : 'Create Trip'}
                </button>
            </div>
        </form>
    )
}
