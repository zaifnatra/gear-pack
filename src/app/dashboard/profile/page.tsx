import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile/profile-form'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    })

    if (!dbUser) {
        // This shouldn't typically happen if auth and db are in sync
        return <div>User not found in database.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">My Profile</h1>
                <p className="text-neutral-500">Manage your account settings and preferences.</p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <ProfileForm
                    initialData={{
                        fullName: dbUser.fullName,
                        bio: dbUser.bio,
                        avatarUrl: dbUser.avatarUrl
                    }}
                />
            </div>
        </div>
    )
}
