import { getCategoryDefaultImage } from '@/lib/constants/category-images'
import Link from 'next/link'

interface GearItem {
    id: string
    name: string
    brand: string | null
    weightGrams: number
    imageUrl: string | null
    condition: string
    category: { id: string; name: string } | null
}

// ... existing code ...

export function GearCard({ item, onEdit, showWeight = true, readOnly = false }: { item: GearItem; onEdit?: (item: GearItem) => void; showWeight?: boolean; readOnly?: boolean }) {
    const displayImage = item.imageUrl || getCategoryDefaultImage(item.category?.name)

    return (
        <div
            onClick={() => !readOnly && onEdit?.(item)}
            className={`group relative block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 ${readOnly ? '' : 'cursor-pointer'}`}
        >
            <div className="aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img src={displayImage} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />

                {showWeight && (
                    <div className="absolute top-2 right-2 flex gap-1">
                        <div className="flex h-6 items-center justify-center rounded-full bg-black/60 px-2 text-[10px] font-medium text-white backdrop-blur-sm">
                            {item.weightGrams}g
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3">
                <h3 className="truncate font-medium text-neutral-900 dark:text-neutral-100">{item.name}</h3>
                <p className="truncate text-xs text-neutral-500">{item.brand || 'Unknown Brand'}</p>

                <div className="mt-2 flex items-center justify-between">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {item.category?.name || 'Uncategorized'}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold ${item.condition === 'NEW' ? 'text-green-600' :
                        item.condition === 'POOR' ? 'text-red-500' : 'text-neutral-500'
                        }`}>
                        {item.condition}
                    </span>
                </div>
            </div>
        </div>
    )
}
