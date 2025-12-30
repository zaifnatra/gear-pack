'use client'

import { useState, useTransition } from 'react'
import { deleteAccount } from '@/app/actions/user'
import { toast } from 'sonner'

export function SettingsView() {
    const [isPending, startTransition] = useTransition()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDelete = async () => {
        startTransition(async () => {
            const res = await deleteAccount()
            if (res?.error) {
                toast.error(res.error)
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-neutral-100">Settings</h1>
                <p className="text-neutral-500 mt-2">Manage your account preferences and support.</p>
            </div>

            {/* Support Section */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                    Help & Support
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
                    Need help with the app? Found a bug? Or just want to say hi?
                    We're here to help you get the most out of Gear-Pack.
                </p>
                <div className="flex gap-4">
                    <a
                        href="mailto:huzai@example.com"
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        Contact Support
                    </a>
                    {/* Placeholder for Docs link if needed */}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-900/10">
                <h2 className="text-lg font-bold font-heading text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    Danger Zone
                </h2>
                <p className="text-red-600/80 dark:text-red-400/80 text-sm mb-6">
                    Permanently delete your account and all of your content. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 transition-colors dark:border-red-900/50 dark:bg-transparent dark:hover:bg-red-900/20"
                    >
                        Delete Account
                    </button>
                ) : (
                    <div className="rounded-xl bg-white p-4 border border-red-100 shadow-lg dark:bg-neutral-900 dark:border-red-900/30">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                            Are you absolutely sure? This will delete all your trips, gear, and messages.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="rounded-lg bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {isPending ? 'Deleting...' : 'Yes, Delete My Account'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
