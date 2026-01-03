'use client'

import { useState, useEffect } from 'react'
import { getGearItems } from '@/app/actions/gear'
import { addMultipleGearToTrip } from '@/app/actions/tripGear'
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadGear()
            setSelectedIds(new Set())
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

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleAdd = async () => {
        if (selectedIds.size === 0) return

        setAdding(true)
        // Import this function at the top (I'll do it in next edit or assume it's there? No I must import it)
        // For now let's assume I can import it. I'll need to update imports in a separate edit or here if I catch it.
        // Wait, I can't easily change imports here without replacing the whole file or top. 
        // I will replace the whole file content to be safe and clean.

        // Dynamic import or separate step? I'll use the imported function.
        // wait, I need to update the imports first. 
        // Let's just use the existing addGearToTrip for now in a loop? NO, that's inefficient.
        // I will update the imports in a separate step or Replace the WHOLE file.
        // Let's replace only the body for now, and I'll update imports in next step.
        // Actually, I should just use `import { addMultipleGearToTrip } ...`

        // I will do a subsequent edit to fix the import.

        // Temporary: I'll just use the new function name, assuming I'll fix imports.

        const res = await addMultipleGearToTrip(tripId, Array.from(selectedIds), userId, true)

        if (res.success) {
            router.refresh()
            onClose()
            setSelectedIds(new Set())
        } else {
            alert(res.error || 'Failed to add gear')
        }
        setAdding(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
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
                                onClick={() => toggleSelection(item.id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-all ${selectedIds.has(item.id)
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-transparent hover:bg-white dark:hover:bg-neutral-800'
                                    }`}
                            >
                                <div className={`relative flex h-5 w-5 items-center justify-center rounded border ${selectedIds.has(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300 dark:border-neutral-600'}`}>
                                    {selectedIds.has(item.id) && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>
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
                        disabled={selectedIds.size === 0 || adding}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding ? 'Adding...' : `Add ${selectedIds.size} Item${selectedIds.size !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    )
}
