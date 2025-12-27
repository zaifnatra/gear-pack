import { GearCard } from './GearCard'

// Define the type here or import from Prisma types if generated
interface GearItem {
    id: string
    name: string
    brand: string | null
    weightGrams: number
    imageUrl: string | null
    condition: string // Simplified for now
    category: { id: string; name: string } | null
}

export function GearGrid({ items, onEdit }: { items: any[]; onEdit: (item: any) => void }) {
    if (!items || items.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50">
                <p className="text-sm text-neutral-500">No items found.</p>
                <button
                    onClick={() => onEdit(null)} // Trigger add mode 
                    className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Add Item
                </button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
                <GearCard key={item.id} item={item} onEdit={onEdit} />
            ))}
        </div>
    )
}
