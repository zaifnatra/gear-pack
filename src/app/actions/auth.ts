'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function signIn(formData: FormData) {
    let login = formData.get('login') as string // Can be email or username
    const password = formData.get('password') as string
    const cookieStore = await cookies()

    // Determine if login is email or username
    const isEmail = login.includes('@')
    let email = login

    if (!isEmail) {
        // Resolve username to email
        const user = await prisma.user.findUnique({
            where: { username: login }
        })

        if (!user) {
            return { success: false, error: 'Invalid login credentials' }
        }
        email = user.email
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function signUp(formData: FormData) {
    const email = formData.get('email') as string
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const cookieStore = await cookies()

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
        where: { username }
    })

    if (existingUser) {
        return { success: false, error: 'Username already taken' }
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
        where: { email }
    })

    if (existingEmail) {
        return { success: false, error: 'Email already registered. Try signing in.' }
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )

    const origin = (await headers()).get('origin')

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                full_name: fullName,
                username: username,
            },
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    if (data.session) {
        // Session created immediately (email confirm disabled?)
        // Sync with Prisma (omitted for brevity, keeping existing logic below if needed)
    } else if (data.user && !data.session) {
        // User created but not confirmed
        // Still create Basic Prisma User? Yes, to reserve username.
        try {
            await prisma.user.create({
                data: {
                    id: data.user.id,
                    email: email,
                    fullName: fullName,
                    username: username,
                }
            })
            return { success: true, checkEmail: true }
        } catch (dbError) {
            console.error('Failed to create user in DB:', dbError)
            return { success: false, error: 'Failed to create user profile' }
        }
    }

    // Sync with Prisma
    if (data.user) {
        try {
            await prisma.user.create({
                data: {
                    id: data.user.id,
                    email: email,
                    fullName: fullName,
                    username: username,
                }
            })
        } catch (dbError) {
            console.error('Failed to create user in DB:', dbError)
            // Ideally we might rollback auth user here, or handle specific error for duplicate email if race condition
        }
    }

    return { success: true }
}

export async function signOut() {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                    }
                },
            },
        }
    )

    await supabase.auth.signOut()
    redirect('/login')
}
