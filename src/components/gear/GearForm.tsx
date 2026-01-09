'use client'

import { useState, useTransition, useEffect } from 'react'
import { createGearItem, updateGearItem, deleteGearItem } from '@/app/actions/gear'
import { getCategories } from '@/app/actions/categories'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { OUTDOOR_BRANDS } from '@/lib/constants/brands'

interface GearFormProps {
    userId: string
    onSuccess: () => void
    initialData?: any // Can be typed more strictly later
}

export function GearForm({ userId, onSuccess, initialData }: GearFormProps) {
    const [isPending, startTransition] = useTransition()
    const [categories, setCategories] = useState<any[]>([])

    // Form State (initialized from props if available)
    const [name, setName] = useState(initialData?.name || '')
    const [brand, setBrand] = useState(initialData?.brand || '')
    const [weight, setWeight] = useState(initialData?.weightGrams?.toString() || '')
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
    const [condition, setCondition] = useState(initialData?.condition || 'GOOD')
    const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imageUrl || null)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        // Load categories on mount
        getCategories().then((res) => {
            if (res.success && res.data) {
                setCategories(res.data)
            }
        })
    }, [])

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const handleConfirmDelete = async () => {
        if (!initialData) return

        startTransition(async () => {
            const res = await deleteGearItem(initialData.id, userId)
            if (res.success) {
                onSuccess()
            } else {
                alert('Failed to delete item')
            }
        })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            let res;

            const payload = {
                name,
                brand,
                weightGrams: weight ? parseInt(weight) : undefined,
                categoryId,
                condition,
                imageUrl: imageUrl || undefined
            }

            if (initialData) {
                res = await updateGearItem(initialData.id, userId, payload)
            } else {
                res = await createGearItem(userId, payload)
            }

            if (res.success) {
                // Reset and close
                setName('')
                setBrand('')
                setWeight('')
                setCategoryId('')
                setImageUrl(null)
                onSuccess()
            } else {
                alert('Failed to save item')
            }
        })
    }

    if (showDeleteConfirm) {
        return (
            <div className="space-y-4 py-4 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center justify-center text-center space-y-3 p-4 bg-red-50 rounded-xl border border-red-100 dark:bg-red-900/10 dark:border-red-900/30">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 dark:bg-red-900/40 dark:text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" x2="10" y1="11" y2="17" />
                            <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-400">Delete "{initialData?.name}"?</h3>
                        <p className="text-sm text-red-700/80 dark:text-red-400/80 mt-1">This action cannot be undone. Are you sure?</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmDelete}
                        disabled={isPending}
                        className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {isPending ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center pb-2">
                <ImageUpload onUploadComplete={setImageUrl} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="e.g. Zpacks Duplex"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Brand</label>
                    <input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        list="brand-suggestions"
                        className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="e.g. Zpacks"
                    />
                    <datalist id="brand-suggestions">
                        {OUTDOOR_BRANDS.map((brand) => (
                            <option key={brand} value={brand} />
                        ))}
                    </datalist>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (g)</label>
                    <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="e.g. 550"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900"
                >
                    <option value="">Select a category</option>
                    {categories.map((parent) => (
                        <optgroup key={parent.id} label={parent.name}>
                            {parent.children?.map((child: any) => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <div className="flex gap-2">
                    {['NEW', 'GOOD', 'FAIR', 'POOR'].map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCondition(c)}
                            className={`rounded-md px-3 py-1 text-xs font-medium border ${condition === c ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-white border-neutral-200 text-neutral-600 dark:bg-neutral-900 dark:border-neutral-800'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                {initialData && (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        disabled={isPending}
                        className="flex-1 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Delete
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                    {isPending ? 'Saving...' : (initialData ? 'Save Changes' : 'Add to Closet')}
                </button>
            </div>
        </form>
    )
}
