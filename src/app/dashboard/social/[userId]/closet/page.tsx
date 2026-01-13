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
        // Fetch public details for preview
        const publicProfile = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, username: true, avatarUrl: true, bio: true }
        })

        if (!publicProfile) {
            return <div>User not found</div>
        }

        // Check for pending request
        const existingRequest = await prisma.friendship.findFirst({
            where: {
                userId: user.id,
                friendId: userId,
                status: 'PENDING'
            }
        })

        const isRequestSent = !!existingRequest

        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center max-w-md mx-auto px-4">
                <div className="h-24 w-24 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800 mb-6 ring-4 ring-neutral-50 dark:ring-neutral-900 shadow-xl">
                    {publicProfile.avatarUrl ? (
                        <img src={publicProfile.avatarUrl} alt={publicProfile.username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-500">
                            {publicProfile.username.slice(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                    {publicProfile.fullName || publicProfile.username}
                </h2>
                <p className="text-neutral-500 text-lg mb-4">@{publicProfile.username}</p>

                {publicProfile.bio && (
                    <p className="text-neutral-600 dark:text-neutral-400 mb-8 italic">
                        "{publicProfile.bio}"
                    </p>
                )}

                <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 w-full mb-8 border border-neutral-100 dark:border-neutral-800">
                    <p className="text-neutral-500 text-sm mb-4">
                        Connect with {publicProfile.fullName || publicProfile.username} to view their gear closet, shared trips, and more.
                    </p>

                    {isRequestSent ? (
                        <button disabled className="w-full rounded-full bg-neutral-200 px-6 py-3 font-bold text-neutral-500 cursor-not-allowed">
                            Request Sent
                        </button>
                    ) : (
                        <form action={async () => {
                            'use server'
                            // We need to import simple one-off action here or call the binded one. 
                            // Since we are inside a server component async function, we can't use 'use server' inline easily for imports outside.
                            // Actually, let's use a Client Component wrapper for the button or just a form with a server action import.
                            // But for simplicity in this file replacement without changing imports too much:
                            // We will use a form action calling the imported server action directly if possible, 
                            // but Next.js server actions need to be imported.
                            // Wait, I can't call imported `sendFriendRequest` directly in "action={}" unless it is a bound server action.
                            // Let's use a client component approach? No, let's try to keep it server-side if simple.
                            // Actually, I'll need to make a small client component button or just use a form that invokes the action.
                            // Let's assume there is a `SendFriendRequestButton` but there isn't.
                            // I will invoke the action via a form.
                            const { sendFriendRequest } = await import('@/app/actions/social')
                            await sendFriendRequest(user.id, userId)
                        }}>
                            <button type="submit" className="w-full rounded-full bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700 hover:scale-105 transition-all shadow-lg shadow-emerald-500/20">
                                Send Friend Request
                            </button>
                        </form>
                    )}
                </div>

                <Link
                    href="/dashboard/social"
                    className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300"
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
