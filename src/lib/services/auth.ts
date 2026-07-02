import { prisma } from '@/lib/prisma'
import { createDefaultPreferenceStore } from '@/lib/ai/preferences'
import type { Prisma } from '@prisma/client'
import { createClient as createSupabaseClient, type Session } from '@supabase/supabase-js'

const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN!.replace(/\/$/, '')

function createStatelessClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

function toSessionPayload(session: Session) {
    return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
    }
}

/**
 * Password login for native clients. Mirrors the web `signIn` action:
 * accepts a username or an email, resolves usernames server-side so the
 * mapping is never exposed, and returns the Supabase session tokens for the
 * app to store (the web keeps its cookie flow instead).
 */
export async function loginWithPassword(login: string, password: string) {
    try {
        const isEmail = login.includes('@')
        let email = login

        if (!isEmail) {
            const user = await prisma.user.findUnique({
                where: { username: login }
            })

            if (!user) {
                return { success: false, error: 'Invalid login credentials' }
            }
            email = user.email
        }

        const supabase = createStatelessClient()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error || !data.session) {
            return { success: false, error: error?.message ?? 'Invalid login credentials' }
        }

        return { success: true, data: { session: toSessionPayload(data.session) } }
    } catch (error) {
        console.error('Login failed:', error)
        return { success: false, error: 'Login failed' }
    }
}

/**
 * Registration for native clients. Mirrors the web `signUp` action:
 * pre-checks username/email uniqueness in Prisma, creates the Supabase auth
 * user, and creates the Prisma User row (reserving the username even before
 * email confirmation).
 */
export async function register(input: {
    email: string
    username: string
    password: string
    fullName: string
}) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { username: input.username }
        })

        if (existingUser) {
            return { success: false, error: 'Username already taken' }
        }

        const existingEmail = await prisma.user.findUnique({
            where: { email: input.email }
        })

        if (existingEmail) {
            return { success: false, error: 'Email already registered. Try signing in.' }
        }

        const supabase = createStatelessClient()
        const { data, error } = await supabase.auth.signUp({
            email: input.email,
            password: input.password,
            options: {
                emailRedirectTo: `${appOrigin}/auth/callback`,
                data: {
                    full_name: input.fullName,
                    username: input.username,
                },
            },
        })

        if (error) {
            return { success: false, error: error.message }
        }

        if (!data.user) {
            return { success: false, error: 'Failed to create account' }
        }

        try {
            await prisma.user.create({
                data: {
                    id: data.user.id,
                    email: input.email,
                    fullName: input.fullName,
                    username: input.username,
                    preferences: createDefaultPreferenceStore() as unknown as Prisma.InputJsonValue,
                }
            })
        } catch (dbError) {
            console.error('Failed to create user in DB:', dbError)
            return { success: false, error: 'Failed to create user profile' }
        }

        return {
            success: true,
            data: {
                checkEmail: !data.session,
                session: data.session ? toSessionPayload(data.session) : null,
            }
        }
    } catch (error) {
        console.error('Registration failed:', error)
        return { success: false, error: 'Registration failed' }
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const supabase = createStatelessClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appOrigin}/auth/callback?next=/dashboard/profile`, // Redirect to profile to set new password
        })

        if (error) {
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Password reset failed:', error)
        return { success: false, error: 'Password reset failed' }
    }
}

/**
 * Server-side part of logout: clears the user's AI thread, matching the web
 * `signOut` action. Token revocation itself happens client-side via
 * `supabase.auth.signOut()` in the app.
 */
export async function clearSessionState(userId: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { backboardThreadId: null }
        })
        return { success: true }
    } catch (e) {
        console.error('Failed to clear AI thread on logout', e)
        return { success: false, error: 'Failed to clear session state' }
    }
}
