import { prisma } from '@/lib/prisma'
import { createDefaultPreferenceStore } from '@/lib/ai/preferences'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Prisma } from '@prisma/client'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { fileTypeFromBuffer } from 'file-type'

const AVATAR_BUCKET = 'avatars'
const GOOGLE_AVATAR_HOSTS = ['googleusercontent.com', 'google.com']
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'])

const PUBLIC_USER_SELECT = {
    id: true,
    email: true,
    username: true,
    fullName: true,
    avatarUrl: true,
    bio: true,
    location: true,
    isPaid: true,
    createdAt: true,
} satisfies Prisma.UserSelect

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

async function cacheProviderAvatar(
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

/**
 * Idempotent find-or-create of the Prisma User row for an authenticated
 * Supabase user. The web OAuth callback and the native app's post-sign-in
 * `POST /api/v1/auth/sync` both go through here, so a first-time Google or
 * Apple sign-in from any client always ends up with a User row.
 *
 * Tolerates missing metadata (Sign in with Apple often provides no name and
 * a private-relay email): the username falls back to the email prefix.
 */
export async function syncAuthUser(params: {
    userId: string
    email: string | null | undefined
    fullName?: string | null
    avatarUrl?: string | null
    accessToken?: string | null
    username?: string | null
}) {
    try {
        const dbUser = await prisma.user.findUnique({ where: { id: params.userId } })

        const shouldCacheAvatar = !dbUser?.avatarUrl || isGoogleHostedAvatar(dbUser.avatarUrl)
        // Only build the storage client when there is actually something to cache
        const cachedAvatarUrl = params.accessToken && shouldCacheAvatar && isGoogleHostedAvatar(params.avatarUrl)
            ? await cacheProviderAvatar(
                createAuthenticatedStorageClient(params.accessToken),
                params.userId,
                params.avatarUrl
            )
            : null

        if (dbUser) {
            if (cachedAvatarUrl) {
                const updated = await prisma.user.update({
                    where: { id: params.userId },
                    data: { avatarUrl: cachedAvatarUrl },
                    select: PUBLIC_USER_SELECT,
                })
                return { success: true, created: false, data: updated }
            }

            const existing = await prisma.user.findUnique({
                where: { id: params.userId },
                select: PUBLIC_USER_SELECT,
            })
            return { success: true, created: false, data: existing }
        }

        if (!params.email) {
            return { success: false, error: 'Cannot create profile without an email address' }
        }

        let username: string
        if (params.username) {
            const taken = await prisma.user.findUnique({ where: { username: params.username } })
            if (taken) {
                return { success: false, error: 'Username already taken' }
            }
            username = params.username
        } else {
            // Generate unique username
            const base = params.fullName?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
                || params.email.split('@')[0]?.replace(/[^a-zA-Z0-9]/g, '')
                || 'user'
            const random = Math.floor(Math.random() * 10000)
            username = `${base}${random}`.substring(0, 25)
        }

        const created = await prisma.user.create({
            data: {
                id: params.userId,
                email: params.email,
                username,
                fullName: params.fullName ?? null,
                avatarUrl: cachedAvatarUrl,
                preferences: createDefaultPreferenceStore() as unknown as Prisma.InputJsonValue,
            },
            select: PUBLIC_USER_SELECT,
        })

        return { success: true, created: true, data: created }
    } catch (error) {
        console.error('Failed to sync auth user to Prisma:', error)
        return { success: false, error: 'Failed to sync user profile' }
    }
}

export async function getMe(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: PUBLIC_USER_SELECT,
        })

        if (!user) {
            return { success: false, error: 'Profile not found' }
        }

        return { success: true, data: user }
    } catch (error) {
        console.error('Failed to fetch profile:', error)
        return { success: false, error: 'Failed to fetch profile' }
    }
}

export async function updateProfile(userId: string, data: {
    fullName?: string
    bio?: string
    avatarUrl?: string
    location?: string
}) {
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName: data.fullName || null,
                bio: data.bio || null,
                avatarUrl: data.avatarUrl || null,
                location: data.location || null,
            },
            select: PUBLIC_USER_SELECT,
        })

        return { success: true, data: user }
    } catch (error) {
        console.error('Failed to update profile:', error)
        return { success: false, error: 'Failed to update profile' }
    }
}

/**
 * Deletes the user's application data AND the Supabase auth user.
 * Deleting only the Prisma row would leave a login-able auth account behind
 * — Apple's account-deletion guideline (5.1.1(v)) requires the real thing.
 */
export async function deleteAccount(userId: string) {
    try {
        // 1. Delete application data (cascades to related records)
        await prisma.user.delete({
            where: { id: userId }
        })

        // 2. Delete the Supabase auth user so the account cannot log back in
        const admin = createAdminClient()
        if (admin) {
            const { error } = await admin.auth.admin.deleteUser(userId)
            if (error) {
                console.error(`Failed to delete Supabase auth user ${userId}:`, error)
                return { success: true, warning: 'Auth account could not be fully removed' }
            }
        } else {
            console.warn('SUPABASE_SERVICE_ROLE_KEY not configured — auth user was not deleted')
            return { success: true, warning: 'Auth account could not be fully removed' }
        }

        return { success: true }
    } catch (error) {
        console.error('Failed to delete account:', error)
        return { success: false, error: 'Failed to delete account' }
    }
}
