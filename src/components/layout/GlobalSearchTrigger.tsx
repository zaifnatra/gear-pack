'use client'

import { useState } from 'react'
import { SearchDialog } from './SearchDialog'

interface GlobalSearchTriggerProps {
    currentUserId: string
}

export function GlobalSearchTrigger({ currentUserId }: GlobalSearchTriggerProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="relative w-full max-w-md group"
            >
                <div className="absolute left-2.5 top-2.5 text-neutral-400 group-hover:text-emerald-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <div
                    className="flex h-10 w-full items-center rounded-full border border-neutral-200/60 bg-white/50 pl-10 pr-4 text-sm text-neutral-500 transition-all hover:bg-white hover:shadow-sm hover:border-emerald-200 dark:border-neutral-800 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
                >
                    Search gear, trips, people...
                </div>
            </button>
            <SearchDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                currentUserId={currentUserId}
            />
        </>
    )
}
