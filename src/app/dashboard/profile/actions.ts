'use server'

import { createClient } from '@/lib/supabase/server'
import { updateProfile as updateProfileService } from '@/lib/services/users'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const ProfileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(50).optional().or(z.literal("")),
    bio: z.string().max(300, "Bio must be less than 300 characters").optional().or(z.literal("")),
    avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    location: z.string().max(100, "Location must be less than 100 characters").optional().or(z.literal("")),
})

export type ProfileFormValues = z.infer<typeof ProfileSchema>

export async function updateProfile(data: ProfileFormValues) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const result = ProfileSchema.safeParse(data)

    if (!result.success) {
        return { error: 'Invalid data', details: result.error.flatten() }
    }

    const updateResult = await updateProfileService(user.id, result.data)

    if (!updateResult.success) {
        return { error: updateResult.error ?? 'Failed to update profile' }
    }

    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function updatePassword(password: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            return { error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('Failed to update password:', error)
        return { error: 'Failed to update password' }
    }
}
