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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Gear Closet</h1>
                    <p className="text-neutral-500">Manage your inventory and pack weights.</p>
                </div>
                <button
                    onClick={() => handleEdit(null)}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Item
                </button>
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
