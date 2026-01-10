'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, signUp, resetPassword } from '@/app/actions/auth'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Typewriter } from '@/components/ui/typewriter-text'

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="w-full min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-900 items-center justify-center overflow-hidden">
        <img
          src="/signinpicture.jpeg"
          alt="Hiking Adventure"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 text-white max-w-lg p-12">
          <h1 className="text-6xl font-bold mb-8 leading-tight">
            <Typewriter
              text={["Gear up for your next adventure.", "Plan lighter, go further.", "Explore with confidence."]}
              speed={70}
              delay={2000}
              loop={true}
            />
          </h1>
        </div>
      </div>

      {/* Right side - Login/Signup form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-8 hover:scale-105 transition-transform duration-300">
              <img src="/logo-light.svg" alt="Gear-Pack" className="h-10 w-auto" />
            </Link>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {view === 'login' && 'Welcome back'}
              {view === 'signup' && 'Join Us Today'}
              {view === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-gray-600">
              {view === 'login' && 'Welcome back to Gear Pack — Continue your journey'}
              {view === 'signup' && 'Welcome to Gear Pack — Start your journey'}
              {view === 'forgot' && 'Enter your email to receive a reset link.'}
            </p>
          </div>

          {statusMessage?.type === 'success' ? (
            <div className="py-8 text-center animate-in fade-in zoom-in duration-300 bg-emerald-50 rounded-xl p-6">
              <h3 className="mb-2 text-xl font-bold text-neutral-900">Check your email</h3>
              <p className="mb-6 text-neutral-500">{statusMessage.text}</p>
              <button
                onClick={() => { setView('login'); setStatusMessage(null); }}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {view !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      })
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                </>
              )}

              <form action={handleSubmit} className="space-y-6">
                {view === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder="johndoe123"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                    {view === 'login' ? 'Email or Username' : 'Email Address'}
                  </label>
                  <input
                    id={view === 'login' ? 'login' : 'email'}
                    name={view === 'login' ? 'login' : 'email'}
                    type={view === 'login' ? 'text' : 'email'}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                {view !== 'forgot' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        placeholder={view === 'login' ? "Enter your password" : "Create a secure password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {view === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setStatusMessage(null); }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {statusMessage && (
                  <div className="rounded-lg p-3 text-sm bg-red-50 text-red-700 border border-red-100">
                    {statusMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
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

              <div className="text-center mt-6">
                <span className="text-gray-600">
                  {view === 'login' ? "Don't have an account?" : "Already have an account?"}
                </span>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView(view === 'login' ? 'signup' : 'login');
                    setStatusMessage(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {view === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
