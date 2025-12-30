import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getGearItems } from '@/app/actions/gear'
import { GearGrid } from '@/components/gear/GearGrid'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ userId: string }>
}

export default async function FriendClosetPage({ params }: PageProps) {
    const { userId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify friendship
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { userId: user.id, friendId: userId, status: 'ACCEPTED' },
                { userId: userId, friendId: user.id, status: 'ACCEPTED' }
            ]
        }
    })

    if (!friendship) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Access Denied</h2>
                <p className="mt-2 text-neutral-500">You must be friends with this user to view their gear closet.</p>
                <Link
                    href="/dashboard/social"
                    className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                    Back to Social Hub
                </Link>
            </div>
        )
    }

    // Fetch friend details
    const friend = await prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, username: true, avatarUrl: true }
    })

    if (!friend) {
        return <div>User not found</div>
    }

    // Fetch gear
    const { data: gearItems } = await getGearItems(userId)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800">
                <Link
                    href="/dashboard/social"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
                            {friend.username.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        {friend.fullName || friend.username}'s Closet
                    </h1>
                    <p className="text-sm text-neutral-500">@{friend.username}</p>
                </div>
            </div>

            <GearGrid
                items={gearItems || []}
                showWeight={true}
                readOnly={true}
            />
        </div>
    )
}
