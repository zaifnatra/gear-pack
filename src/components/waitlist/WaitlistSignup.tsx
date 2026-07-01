'use client'

import { useActionState, useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Mail, Users } from 'lucide-react'
import { getWaitlistCount, joinWaitlist, type WaitlistState } from '@/app/actions/waitlist'

interface WaitlistSignupProps {
    initialCount: number
}

export function WaitlistSignup({ initialCount }: WaitlistSignupProps) {
    const [liveCount, setLiveCount] = useState(initialCount)
    const initialState: WaitlistState = {
        success: false,
        message: '',
        count: initialCount,
    }

    const [state, formAction, isPending] = useActionState(joinWaitlist, initialState)

    useEffect(() => {
        const interval = setInterval(async () => {
            const count = await getWaitlistCount()
            setLiveCount(count)
        }, 10000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/95 p-5 shadow-2xl shadow-neutral-950/20 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase text-neutral-500">Waiting now</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-heading text-4xl font-bold text-neutral-950 dark:text-white">
                            {Math.max(liveCount, state.count).toLocaleString()}
                        </span>
                        <span className="text-sm font-medium text-neutral-500">people</span>
                    </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <Users className="h-5 w-5" />
                </div>
            </div>

            <form action={formAction} className="space-y-3">
                <label htmlFor="waitlist-email" className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Email address
                </label>
                <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                            id="waitlist-email"
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="h-11 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm font-medium text-neutral-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Join waitlist"
                    >
                        <ArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </form>

            {state.message && (
                <div className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${state.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200'
                    }`}>
                    {state.success && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{state.message}</span>
                </div>
            )}
        </div>
    )
}
