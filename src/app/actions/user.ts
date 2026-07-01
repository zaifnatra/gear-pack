'use server'

import { deleteAccount as deleteAccountService } from '@/lib/services/users'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount() {
    let deleted = false

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // 1. Delete application data + Supabase auth user
        const result = await deleteAccountService(user.id)
        if (!result.success) {
            return result
        }
        deleted = true

        // 2. Sign out from Supabase
        await supabase.auth.signOut()

        // 3. Redirect to home
    } catch (error) {
        console.error('Failed to delete account:', error)
        if (!deleted) {
            return { success: false, error: 'Failed to delete account' }
        }
    }

    redirect('/')
}
