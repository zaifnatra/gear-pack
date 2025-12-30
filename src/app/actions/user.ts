'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteAccount() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // 1. Delete from Prisma (Cascading will handle related data)
        await prisma.user.delete({
            where: { id: user.id }
        })

        // 2. Sign out from Supabase
        await supabase.auth.signOut()

        // 3. Redirect to home
    } catch (error) {
        console.error('Failed to delete account:', error)
        return { success: false, error: 'Failed to delete account' }
    }

    redirect('/')
}
