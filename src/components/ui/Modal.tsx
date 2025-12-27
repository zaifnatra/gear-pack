'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal()
        } else {
            dialogRef.current?.close()
        }
    }, [isOpen])

    // Handle clicking outside to close
    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <dialog
            ref={dialogRef}
            className="backdrop:bg-black/50 backdrop:backdrop-blur-sm m-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50"
            onClick={handleBackdropClick}
            onClose={onClose}
        >
            <div className="flex h-14 items-center justify-between border-b border-neutral-100 px-6 dark:border-neutral-800">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                    onClick={onClose}
                    className="ml-auto text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="M6 6 18 18" /></svg>
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </dialog>
    )
}
