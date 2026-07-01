import { syncAuthUser } from '@/lib/services/users'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN!.replace(/\/$/, '')

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (!code) {
        return NextResponse.redirect(`${appOrigin}/auth/auth-code-error`)
    }

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
                }
            },
        }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data?.session?.user) {
        return NextResponse.redirect(`${appOrigin}/auth/auth-code-error`)
    }

    const user = data.session.user

    // Sync with Prisma: creates the User row on first OAuth login
    const result = await syncAuthUser({
        userId: user.id,
        email: user.email,
        fullName: user.user_metadata.full_name,
        avatarUrl: user.user_metadata.avatar_url,
        accessToken: data.session.access_token,
    })

    if (!result.success) {
        console.error('Failed to sync OAuth user to Prisma:', result.error)
    }

    return NextResponse.redirect(`${appOrigin}${next}`)
}
