'use client'

import { useState } from 'react'

export interface TrailOption {
    id: string
    name: string
    location: string
    driveTime: string
    distance: number
    elevationGain: number
    difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME'
    description: string
    externalUrl?: string
}

interface TrailCardProps {
    trail: TrailOption
    onSelect: (trailId: string) => void
}

export function TrailCard({ trail, onSelect }: TrailCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    const difficultyColor = {
        EASY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        MODERATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        HARD: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        EXTREME: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    }

    return (
        <div
            className="group relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Minimal Header / Gradient Fallback if no image */}
            <div className={`h-24 w-full bg-gradient-to-r ${trail.difficulty === 'EASY' ? 'from-emerald-500 to-teal-500' :
                    trail.difficulty === 'MODERATE' ? 'from-amber-500 to-orange-500' :
                        trail.difficulty === 'HARD' ? 'from-red-500 to-rose-500' :
                            'from-purple-600 to-indigo-600'
                } opacity-80`}>
                <div className="flex h-full items-end p-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md bg-white/90 text-neutral-900`}>
                        {trail.difficulty}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-1 flex items-start justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 line-clamp-1" title={trail.name}>
                        🥾 {trail.name}
                    </h3>
                </div>

                <div className="mb-4 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1">
                        📍 {trail.location}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center gap-1">
                        🚗 {trail.driveTime}
                    </span>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/50">
                        <div className="text-xs font-medium text-neutral-500 uppercase">Distance</div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{trail.distance} km</div>
                    </div>
                    <div className="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/50">
                        <div className="text-xs font-medium text-neutral-500 uppercase">Elevation</div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{trail.elevationGain} m ↗</div>
                    </div>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 line-clamp-2">
                    {trail.description}
                </p>

                <div className="mt-auto flex gap-3">
                    <button
                        onClick={() => onSelect(trail.id)}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
                    >
                        ✓ Select Trail
                    </button>
                    {trail.externalUrl && (
                        <a
                            href={trail.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            title="View on AllTrails"
                        >
                            ℹ️
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
