import { prisma } from '@/lib/prisma'
import { createDefaultPreferenceStore } from '@/lib/ai/preferences'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function getRedirectOrigin(request: Request) {
    const requestUrl = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto')
    const host = forwardedHost || request.headers.get('host') || requestUrl.host
    const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    const protocol = isLocal ? 'http' : forwardedProto || requestUrl.protocol.replace(':', '') || 'https'

    return `${protocol}://${host}`
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.session?.user) {
            const user = data.session.user

            // Sync with Prisma: Create user if first time login via Google
            try {
                const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
                if (!dbUser) {
                    // Generate unique username
                    const base = user.user_metadata.full_name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'user'
                    const random = Math.floor(Math.random() * 10000)
                    const username = `${base}${random}`.substring(0, 25)

                    await prisma.user.create({
                        data: {
                            id: user.id,
                            email: user.email!, // Email is required in schema, usually present in Google Auth
                            username: username,
                            fullName: user.user_metadata.full_name,
                            avatarUrl: user.user_metadata.avatar_url,
                            preferences: createDefaultPreferenceStore() as object,
                        }
                    })
                }
            } catch (e) {
                console.error("Failed to sync Google user to Prisma:", e)
            }

            return NextResponse.redirect(`${getRedirectOrigin(request)}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
