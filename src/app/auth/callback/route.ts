import { prisma } from '@/lib/prisma'
import { createDefaultPreferenceStore } from '@/lib/ai/preferences'
import type { Prisma } from '@prisma/client'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { fileTypeFromBuffer } from 'file-type'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const AVATAR_BUCKET = 'avatars'
const GOOGLE_AVATAR_HOSTS = ['googleusercontent.com', 'google.com']
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])

function getRedirectOrigin(request: Request) {
    return process.env.APP_ORIGIN?.replace(/\/$/, '') || new URL(request.url).origin
}

function isGoogleHostedAvatar(url: string | null | undefined) {
    if (!url) return false

    try {
        const hostname = new URL(url).hostname
        return GOOGLE_AVATAR_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    } catch {
        return false
    }
}

function createAuthenticatedStorageClient(accessToken: string) {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        }
    )
}

async function cacheGoogleAvatar(
    supabase: SupabaseClient,
    userId: string,
    avatarUrl: string | null | undefined
) {
    if (!avatarUrl || !isGoogleHostedAvatar(avatarUrl)) {
        return null
    }

    try {
        const response = await fetch(avatarUrl, {
            headers: {
                accept: 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/gif,*/*;q=0.8',
            },
        })

        if (!response.ok) {
            console.warn(`Failed to fetch Google avatar for ${userId}: ${response.status}`)
            return null
        }

        const avatarBuffer = await response.arrayBuffer()
        const imageType = await fileTypeFromBuffer(avatarBuffer)

        if (!imageType || !ALLOWED_AVATAR_MIME_TYPES.has(imageType.mime)) {
            const contentType = response.headers.get('content-type') || 'unknown'
            console.warn(`Google avatar for ${userId} did not match an allowed image signature. Header content type: ${contentType}`)
            return null
        }

        const filePath = `${userId}/google-avatar.${imageType.ext}`

        const { error: uploadError } = await supabase.storage
            .from(AVATAR_BUCKET)
            .upload(filePath, avatarBuffer, {
                contentType: imageType.mime,
                upsert: true,
            })

        if (uploadError) {
            console.error(`Failed to upload cached avatar for ${userId}:`, uploadError)
            return null
        }

        const { data } = supabase.storage
            .from(AVATAR_BUCKET)
            .getPublicUrl(filePath)

        return data.publicUrl
    } catch (error) {
        console.error(`Failed to cache Google avatar for ${userId}:`, error)
        return null
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
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
        return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    const user = data.session.user

    // Sync with Prisma: Create user if first time login via Google
    try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
        const googleAvatarUrl = user.user_metadata.avatar_url
        const shouldCacheAvatar = !dbUser?.avatarUrl || isGoogleHostedAvatar(dbUser.avatarUrl)
        const avatarStorageClient = createAuthenticatedStorageClient(data.session.access_token)
        const cachedAvatarUrl = shouldCacheAvatar
            ? await cacheGoogleAvatar(avatarStorageClient, user.id, googleAvatarUrl)
            : null

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
                    avatarUrl: cachedAvatarUrl,
                    preferences: createDefaultPreferenceStore() as unknown as Prisma.InputJsonValue,
                }
            })
        } else if (cachedAvatarUrl) {
            await prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl: cachedAvatarUrl }
            })
        }
    } catch (e) {
        console.error("Failed to sync Google user to Prisma:", e)
    }

    return NextResponse.redirect(`${getRedirectOrigin(request)}${next}`)
}
