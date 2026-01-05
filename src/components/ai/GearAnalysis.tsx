'use client'

import { useState } from 'react'

export interface GearItemAnalysis {
    id?: string
    name: string
    condition?: string
    notes?: string
}

export interface GearCategoryAnalysis {
    category: string
    items: GearItemAnalysis[]
    status: 'READY' | 'WARNING' | 'MISSING'
    suggestion?: string
}

export interface GearAnalysisData {
    summary: string
    categories: GearCategoryAnalysis[]
}

interface GearAnalysisProps {
    data: GearAnalysisData
}

export function GearAnalysis({ data }: GearAnalysisProps) {
    // Default to open
    const [expanded, setExpanded] = useState<Record<string, boolean>>(
        data.categories.reduce((acc, cat) => ({ ...acc, [cat.category]: true }), {})
    )

    const toggle = (category: string) => {
        setExpanded(prev => ({ ...prev, [category]: !prev[category] }))
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'READY': return '✅'
            case 'WARNING': return '⚠️'
            case 'MISSING': return '💡'
            default: return '📦'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'READY': return 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
            case 'WARNING': return 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
            case 'MISSING': return 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'
            default: return 'bg-neutral-50 border-neutral-100'
        }
    }

    return (
        <div className="w-full max-w-md space-y-3">
            {/* Header / Summary */}
            <div className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {data.summary}
            </div>

            {/* Categories */}
            {data.categories.map((cat, idx) => {
                const isExpanded = expanded[cat.category]
                return (
                    <div
                        key={idx}
                        className={`overflow-hidden rounded-xl border ${getStatusColor(cat.status)} transition-all`}
                    >
                        <button
                            onClick={() => toggle(cat.category)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                        >
                            <span className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-100">
                                <span>{getStatusIcon(cat.status)}</span>
                                {cat.category}
                            </span>
                            <span className="text-neutral-400">
                                {isExpanded ? '−' : '+'}
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="px-4 pb-4">
                                {/* Items */}
                                <ul className="space-y-2">
                                    {cat.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                            <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                            <span>
                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{item.name}</span>
                                                {item.condition && <span className="ml-1 text-xs text-neutral-400">({item.condition})</span>}
                                                {item.notes && <div className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">{item.notes}</div>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Suggestion Footer */}
                                {cat.suggestion && (
                                    <div className="mt-3 rounded-lg bg-white/50 p-2 text-xs text-neutral-600 dark:bg-black/20 dark:text-neutral-400">
                                        <span className="font-bold">Suggestion:</span> {cat.suggestion}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
