'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp } from '@/app/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [isCheckEmail, setIsCheckEmail] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const action = isLogin ? signIn : signUp
            const res = await action(formData)

            if (res.success) {
                if ('checkEmail' in res && res.checkEmail) {
                    setIsCheckEmail(true)
                } else {
                    router.push('/dashboard')
                    router.refresh()
                }
            } else {
                alert(res.error || 'Authentication failed')
            }
        })
    }

    if (isCheckEmail) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" /><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Check your email</h2>
                    <p className="text-neutral-500">
                        We've sent a verification link to your email address. Please click the link to activate your account and sign in.
                    </p>
                    <button onClick={() => { setIsCheckEmail(false); setIsLogin(true); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                        Back to sign in
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 11-8-8-8 8" /><path d="M20 12h-4l-3 9L9 12H4l8-8Z" /></svg>
                        GearPack
                    </Link>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                <form action={handleSubmit} className="mt-8 space-y-6">
                    <div className="-space-y-px rounded-md shadow-sm">
                        {!isLogin && (
                            <div>
                                <label htmlFor="fullName" className="sr-only">Full Name</label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required={!isLogin}
                                    className="relative block w-full rounded-t-md border-0 py-1.5 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 sm:text-sm sm:leading-6"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}
                        {!isLogin && (
                            <div>
                                <label htmlFor="username" className="sr-only">Username</label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required={!isLogin}
                                    className="relative block w-full border-0 py-1.5 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 sm:text-sm sm:leading-6"
                                    placeholder="Username"
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="login" className="sr-only">{isLogin ? 'Username or Email' : 'Email address'}</label>
                            <input
                                id={isLogin ? 'login' : 'email'}
                                name={isLogin ? 'login' : 'email'}
                                type={isLogin ? 'text' : 'email'}
                                autoComplete={isLogin ? 'username' : 'email'}
                                required
                                className={`relative block w-full border-0 py-1.5 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 sm:text-sm sm:leading-6 ${isLogin ? 'rounded-t-md' : ''}`}
                                placeholder={isLogin ? 'Username or Email' : 'Email address'}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-neutral-900 ring-1 ring-inset ring-neutral-300 placeholder:text-neutral-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:bg-neutral-900 dark:text-white dark:ring-neutral-700 sm:text-sm sm:leading-6"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
                        >
                            {isPending ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
                    >
                        {isLogin ? 'No account? Sign up' : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}
