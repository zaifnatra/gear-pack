'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, resetPassword } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
    const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login')
    const [isPending, startTransition] = useTransition()
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        setStatusMessage(null)
        startTransition(async () => {
            let res;
            if (view === 'login') {
                res = await signIn(formData)
            } else if (view === 'signup') {
                res = await signUp(formData)
            } else if (view === 'forgot') {
                res = await resetPassword(formData)
            }

            if (res?.success) {
                if (view === 'forgot') {
                    setStatusMessage({ type: 'success', text: 'Check your email for the password reset link.' })
                } else if ('checkEmail' in res && res.checkEmail) {
                    setStatusMessage({ type: 'success', text: 'Please check your email to confirm your account.' })
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            } else {
                setStatusMessage({ type: 'error', text: res?.error || 'An error occurred' })
            }
        })
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">

            {/* Background Auroras (Light Mode - Same as Landing) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-emerald-100/60 blur-[120px] animate-pulse-slow" />
                <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-teal-100/60 blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-emerald-50/60 blur-[120px] animate-pulse-slow delay-2000" />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />


            <div className="relative z-10 flex flex-col flex-grow items-center justify-center p-4">

                {/* Logo */}
                <Link href="/" className="mb-8 hover:scale-105 transition-transform duration-300">
                    <img src="/logo-light.svg" alt="Gear-Pack" className="h-10 w-auto" />
                </Link>

                {/* Card */}
                <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl shadow-emerald-900/5 rounded-3xl p-8 sm:p-10">

                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                            {view === 'login' && 'Welcome back'}
                            {view === 'signup' && 'Create an account'}
                            {view === 'forgot' && 'Reset password'}
                        </h1>
                        <p className="mt-2 text-sm text-neutral-500 font-medium">
                            {view === 'login' && 'Enter your credentials to access your gear.'}
                            {view === 'signup' && 'Start organizing your next adventure today.'}
                            {view === 'forgot' && 'Enter your email to receive a reset link.'}
                        </p>
                    </div>

                    {statusMessage?.type === 'success' ? (
                        <div className="py-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    <path d="m16 19 2 2 4-4" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-neutral-900">Check your email</h3>
                            <p className="mb-8 text-neutral-500">{statusMessage.text}</p>

                            <button
                                onClick={() => { setView('login'); setStatusMessage(null); }}
                                className="w-full rounded-xl bg-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900 hover:bg-neutral-200 transition-colors"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    ) : (
                        <>
                            <form action={handleSubmit} className="space-y-5">

                                {view === 'signup' && (
                                    <>
                                        <div className="space-y-1">
                                            <label htmlFor="fullName" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Full Name</label>
                                            <input
                                                id="fullName"
                                                name="fullName"
                                                type="text"
                                                required
                                                className="block w-full rounded-xl border-neutral-200 bg-white/50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm shadow-sm transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="username" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Username</label>
                                            <input
                                                id="username"
                                                name="username"
                                                type="text"
                                                required
                                                className="block w-full rounded-xl border-neutral-200 bg-white/50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm shadow-sm transition-all"
                                                placeholder="johndoe123"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1">
                                    <label htmlFor="login" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        {view === 'login' ? 'Email or Username' : 'Email Address'}
                                    </label>
                                    <input
                                        id={view === 'login' ? 'login' : 'email'}
                                        name={view === 'login' ? 'login' : 'email'}
                                        type={view === 'login' ? 'text' : 'email'}
                                        required
                                        className="block w-full rounded-xl border-neutral-200 bg-white/50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm shadow-sm transition-all"
                                        placeholder={view === 'login' ? 'you@example.com' : 'you@example.com'}
                                    />
                                </div>

                                {view !== 'forgot' && (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="password" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Password</label>
                                            {view === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setView('forgot'); setStatusMessage(null); }}
                                                    className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            className="block w-full rounded-xl border-neutral-200 bg-white/50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm shadow-sm transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}

                                {statusMessage && (
                                    <div className={`rounded-lg p-3 text-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {statusMessage.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                                >
                                    {isPending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        <>
                                            {view === 'login' && 'Sign In'}
                                            {view === 'signup' && 'Create Account'}
                                            {view === 'forgot' && 'Send Reset Link'}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
                                {view === 'login' ? (
                                    <p className="text-sm text-neutral-500">
                                        Don't have an account?{' '}
                                        <button onClick={() => { setView('signup'); setStatusMessage(null); }} className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                                            Sign up
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-sm text-neutral-500">
                                        Already have an account?{' '}
                                        <button onClick={() => { setView('login'); setStatusMessage(null); }} className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                                            Sign in
                                        </button>
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <footer className="mt-12 text-center text-neutral-400 text-xs font-medium">
                    <p>&copy; {new Date().getFullYear()} Gear-Pack.</p>
                </footer>
            </div>
        </div>
    )
}
