'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { searchGlobal, SearchResult } from '@/app/actions/search'
import { useDebounce } from 'use-debounce'

interface SearchDialogProps {
    isOpen: boolean
    onClose: () => void
    currentUserId: string
}

export function SearchDialog({ isOpen, onClose, currentUserId }: SearchDialogProps) {
    const [query, setQuery] = useState('')
    const [debouncedQuery] = useDebounce(query, 300)
    const [results, setResults] = useState<SearchResult[]>([])
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([])
            return
        }

        startTransition(async () => {
            const res = await searchGlobal(debouncedQuery, currentUserId)
            if (res.success && res.results) {
                setResults(res.results)
            }
        })
    }, [debouncedQuery, currentUserId])

    const handleSelect = (url: string) => {
        onClose()
        router.push(url)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-transparent transition-opacity"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">

                {/* Search Input */}
                <div className="flex items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-neutral-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for people or trips..."
                        className="flex-1 border-0 bg-transparent py-4 text-sm outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                    />
                    <button
                        onClick={onClose}
                        className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && query.length >= 2 && !isPending && (
                        <div className="py-8 text-center text-sm text-neutral-500">
                            No results found for "{query}"
                        </div>
                    )}

                    {results.length === 0 && query.length < 2 && (
                        <div className="py-8 text-center text-sm text-neutral-500">
                            Type at least 2 characters to search...
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result.url)}
                                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    {/* Icon/Avatar */}
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                        {result.type === 'user' ? (
                                            result.image ? (
                                                <img src={result.image} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-neutral-500">
                                                    {result.title.substring(0, 2).toUpperCase()}
                                                </span>
                                            )
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                {result.title}
                                            </span>
                                            <span className="ml-2 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                {result.type}
                                            </span>
                                        </div>
                                        {result.subtitle && (
                                            <p className="text-xs text-neutral-500 truncate">
                                                {result.subtitle}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
