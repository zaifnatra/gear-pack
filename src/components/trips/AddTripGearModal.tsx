'use client'

import { useState, useEffect } from 'react'
import { getGearItems } from '@/app/actions/gear'
import { addGearToTrip } from '@/app/actions/tripGear'
import { useRouter } from 'next/navigation'

interface AddTripGearModalProps {
    isOpen: boolean
    onClose: () => void
    tripId: string
    userId: string
}

export function AddTripGearModal({ isOpen, onClose, tripId, userId }: AddTripGearModalProps) {
    const router = useRouter()
    const [gear, setGear] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadGear()
        }
    }, [isOpen])

    async function loadGear() {
        setLoading(true)
        const res = await getGearItems(userId)
        if (res.success && res.data) {
            setGear(res.data)
        }
        setLoading(false)
    }

    const filteredGear = gear.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand?.toLowerCase().includes(search.toLowerCase())
    )

    const handleAdd = async () => {
        if (!selectedId) return

        setAdding(true)
        // Force isShared = true for all items added to this list
        const res = await addGearToTrip(tripId, selectedId, userId, true)

        if (res.success) {
            router.refresh()
            onClose()
            setSelectedId(null)
        } else {
            alert(res.error || 'Failed to add gear')
        }
        setAdding(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Add Group Gear</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        type="search"
                        placeholder="Search for tent, stove, etc..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-800 dark:bg-neutral-800"
                        autoFocus
                    />
                </div>

                <div className="mb-4 h-64 overflow-y-auto space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-800/50">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-neutral-500 animate-pulse">Loading closet...</div>
                    ) : filteredGear.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-neutral-500">No items found matching "{search}"</div>
                    ) : (
                        filteredGear.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-all ${selectedId === item.id
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-transparent hover:bg-white dark:hover:bg-neutral-800'
                                    }`}
                            >
                                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-200 object-cover dark:bg-neutral-700">
                                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</div>
                                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                                        <span>{item.brand}</span>
                                        {item.weightGrams && <span>• {item.weightGrams}g</span>}
                                    </div>
                                </div>
                                {selectedId === item.id && (
                                    <div className="text-emerald-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedId || adding}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding ? 'Adding...' : 'Add Group Item'}
                    </button>
                </div>
            </div>
        </div>
    )
}
