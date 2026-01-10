'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GearGrid } from '@/components/gear/GearGrid'
import { Modal } from '@/components/ui/Modal'
import { GearForm } from '@/components/gear/GearForm'

interface GearClosetViewProps {
    initialItems: any[]
    userId: string
}

export function GearClosetView({ initialItems, userId }: GearClosetViewProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const router = useRouter()

    const handleEdit = (item: any) => {
        setEditingItem(item)
        setIsAddModalOpen(true)
    }

    const handleClose = () => {
        setIsAddModalOpen(false)
        setEditingItem(null)
    }

    const handleSuccess = () => {
        setIsAddModalOpen(false)
        setEditingItem(null)
        router.refresh() // Refreshes server components to show new data
    }

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-2xl shadow-black/20 min-h-[250px] flex flex-col justify-end group">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/header4.jpg"
                        alt="Gear Background"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black font-heading tracking-tight drop-shadow-sm mb-2">Gear Closet</h1>
                        <p className="text-neutral-200 text-lg font-medium drop-shadow-sm max-w-xl">
                            Inventory your equipment, track weights, and organize your pack.
                        </p>
                    </div>

                    <button
                        onClick={() => handleEdit(null)}
                        className="inline-flex items-center justify-center rounded-full bg-white text-neutral-900 px-6 py-3 font-bold text-sm hover:bg-neutral-100 hover:scale-105 transition-all shadow-lg shadow-black/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Item
                    </button>
                </div>
            </div>

            <GearGrid items={initialItems} onEdit={handleEdit} showWeight={false} />

            <Modal
                isOpen={isAddModalOpen}
                onClose={handleClose}
                title={editingItem ? "Edit Gear" : "Add New Gear"}
            >
                <GearForm userId={userId} onSuccess={handleSuccess} initialData={editingItem} />
            </Modal>
        </div>
    )
}
