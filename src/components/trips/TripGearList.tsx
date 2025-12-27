'use client'

import { useState, useTransition } from 'react'
import { AddTripGearModal } from './AddTripGearModal'
import { togglePacked, removeGearFromTrip } from '@/app/actions/tripGear'
import { useRouter } from 'next/navigation'

interface TripGearListProps {
    tripId: string
    currentUserId: string
    gearList: any[]
}

export function TripGearList({ tripId, currentUserId, gearList }: TripGearListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // STRICTLY FILTER FOR SHARED ITEMS
    const filteredList = gearList.filter(item => item.isShared)

    const handleTogglePacked = async (id: string, currentStatus: boolean) => {
        setPendingIds(prev => new Set(prev).add(id))
        await togglePacked(id, !currentStatus)
        router.refresh()
        setPendingIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }

    const handleRemove = async (id: string) => {
        if (!confirm('Remove this item from the group list?')) return
        startTransition(async () => {
            await removeGearFromTrip(id)
            router.refresh()
        })
    }

    // Stats
    const totalItems = filteredList.length
    const packedItems = filteredList.filter(i => i.isPacked).length
    const progress = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase text-neutral-500">Group Gear</h3>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Add Group Item
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="text-xs text-neutral-500 text-right">
                {packedItems} of {totalItems} items packed ({progress}%)
            </div>

            <div className="space-y-2">
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-neutral-400 border-2 border-dashed border-neutral-100 rounded-xl dark:border-neutral-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                        <p className="text-sm">No group gear added yet.</p>
                        <p className="text-xs text-neutral-400">Add tents, stoves, or shared items.</p>
                    </div>
                ) : (
                    filteredList.map((item) => (
                        <div
                            key={item.id}
                            className={`group flex items-center gap-3 rounded-lg border p-3 transition-all ${item.isPacked
                                    ? 'bg-neutral-50 border-neutral-200 opacity-75 dark:bg-neutral-900 dark:border-neutral-800'
                                    : 'bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={item.isPacked}
                                onChange={() => handleTogglePacked(item.id, item.isPacked)}
                                disabled={pendingIds.has(item.id)}
                                className="h-5 w-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />

                            <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm truncate ${item.isPacked ? 'line-through text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                    {item.gear.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    {item.gear.brand && <span>{item.gear.brand}</span>}
                                    {item.gear.weightGrams && <span>• {item.gear.weightGrams}g</span>}
                                    {/* Always shared now, so maybe we don't need the badge or keep it for clarity */}
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">SHARED</span>
                                </div>
                            </div>

                            {/* Carrier Avatar */}
                            {item.carriedById && item.carrier && (
                                <div className="flex flex-col items-end" title={`Carried by ${item.carrier.fullName}`}>
                                    <div className="h-6 w-6 rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {item.carrier.avatarUrl ? <img src={item.carrier.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">{item.carrier.fullName?.[0]}</div>}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => handleRemove(item.id)}
                                className="hidden group-hover:block p-1 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <AddTripGearModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                tripId={tripId}
                userId={currentUserId}
            />
        </div>
    )
}
