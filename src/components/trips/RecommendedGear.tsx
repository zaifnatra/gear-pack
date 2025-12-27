'use client'

import { useState, useEffect } from 'react'
import { getGearItems } from '@/app/actions/gear'

interface RecommendedGearProps {
    tripId: string
    userId: string
    tripType?: string
    startDate: Date
    days: number
}

export function RecommendedGear({ tripId, userId, tripType, startDate, days }: RecommendedGearProps) {
    const [closet, setCloset] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCloset()
    }, [])

    async function loadCloset() {
        const res = await getGearItems(userId)
        if (res.success && res.data) {
            setCloset(res.data)
        }
        setLoading(false)
    }

    // --- LOGIC ENGINE ---

    // 1. Determine Season & Weather Inference
    const month = new Date(startDate).getMonth() // 0-11
    const isWinter = month >= 11 || month <= 2 // Dec, Jan, Feb, Mar
    const isSummer = month >= 5 && month <= 7 // Jun, Jul, Aug
    // const isShoulder = !isWinter && !isSummer

    // 2. Filter Essentials based on Duration
    const isOvernight = days > 1

    const essentialCategories = [
        { category: 'Pack', icon: '🎒', match: ['pack', 'backpack'], required: true },
        // Only require shelter/sleep/kitchen for overnight trips
        { category: 'Shelter', icon: '⛺', match: ['tent', 'shelter', 'hammock', 'bivy'], required: isOvernight },
        { category: 'Sleep System', icon: '🛌', match: ['sleeping bag', 'quilt', 'pad'], required: isOvernight },
        { category: 'Kitchen', icon: '🔥', match: ['stove', 'cook'], required: isOvernight },
        // Always good to have water filtration
        { category: 'Hydration', icon: '💧', match: ['filter', 'bottle', 'bladder'], required: true },
    ]

    const essentials = essentialCategories.filter(c => c.required).map(cat => ({
        ...cat,
        matches: closet.filter(item => {
            const searchStr = (item.name + ' ' + (item.category?.name || '')).toLowerCase()
            return cat.match.some(m => searchStr.includes(m))
        })
    }))

    // 3. Layering System Recommendations
    const layeringSystem = [
        { category: 'Shell / Rain', icon: '🌧️', match: ['rain', 'shell', 'gore-tex'], required: true, reason: 'Always bring rain protection.' },
        { category: 'Mid Layer (Fleece)', icon: '👕', match: ['fleece', 'midlayer', 'r1'], required: true, reason: 'Essential for active warmth.' },
        { category: 'Insulation (Puffy)', icon: '🧥', match: ['down', 'puffy', 'synthetic', 'insul'], required: isWinter || !isSummer, reason: isWinter ? 'Critical for winter safety.' : 'Good for breaks and emergencies.' },
        { category: 'Base Layer', icon: '🌡️', match: ['base', 'thermal', 'merino'], required: isWinter, reason: 'Moisture management is key in cold.' },
        { category: 'Sun Hoody', icon: '☀️', match: ['sun', 'hoody', 'uv'], required: isSummer, reason: 'Protection from high UV exposure.' },
    ]

    const layers = layeringSystem.filter(l => l.required).map(layer => ({
        ...layer,
        matches: closet.filter(item => {
            const searchStr = (item.name + ' ' + (item.category?.name || '')).toLowerCase()
            return layer.match.some(m => searchStr.includes(m))
        })
    }))

    if (loading) return <div className="h-40 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />

    return (
        <div className="space-y-6">
            {/* Essentials Section */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M15 11v.01" /></svg>
                    Smart Essentials
                </h2>
                <div className="space-y-4">
                    {essentials.map((rec) => (
                        <RecommendationRow key={rec.category} item={rec} />
                    ))}
                </div>
            </div>

            {/* Layering Section */}
            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><path d="M20.2 6 3 11l-.9-2.4c-.5-1.1.5-2.2 1.7-1.7l2.4.9L6 3.8c1.1-1.7 2.2-.5 1.7 1.7l-.9 2.4L20.2 6Z" /><path d="m8.1 8.1 8.2 8.2" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c2.3 0 4.5-.8 6.3-2.1" /></svg>
                        Layering Guide
                    </h2>
                    <p className="text-sm text-neutral-500">
                        {isWinter ? 'Winter conditions detected. Prioritize warmth.' : isSummer ? 'Summer conditions. Focus on sun protection and breathability.' : 'Shoulder season. Bring layers for changing weather.'}
                    </p>
                </div>
                <div className="space-y-4">
                    {layers.map((rec) => (
                        <RecommendationRow key={rec.category} item={rec} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function RecommendationRow({ item }: { item: any }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl dark:bg-neutral-800">
                {item.icon}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{item.category}</h4>
                    {item.reason && <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{item.reason}</span>}
                </div>

                {item.matches.length > 0 ? (
                    <div className="mt-2 space-y-2">
                        {item.matches.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                <span className="truncate">{m.name}</span>
                                {m.weightGrams && <span className="text-xs text-neutral-400">({m.weightGrams}g)</span>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-1 text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        Not found in closet
                    </div>
                )}
            </div>
        </div>
    )
}
