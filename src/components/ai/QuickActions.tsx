'use client'

export interface QuickAction {
    label: string
    value: string
}

interface QuickActionsProps {
    actions: QuickAction[]
    onAction: (value: string) => void
    disabled?: boolean
}

export function QuickActions({ actions, onAction, disabled }: QuickActionsProps) {
    if (!actions || actions.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 py-2">
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => onAction(action.value)}
                    disabled={disabled}
                    className="
                        group relative inline-flex items-center justify-center rounded-full 
                        border border-blue-200 bg-blue-50 px-4 py-2 
                        text-sm font-medium text-blue-700 
                        transition-all hover:border-blue-300 hover:bg-blue-100/80 hover:shadow-sm
                        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                        dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30
                    "
                >
                    {action.label}
                </button>
            ))}
        </div>
    )
}
