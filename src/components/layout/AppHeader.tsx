import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ProfileDropdown } from './ProfileDropdown'
import { NotificationDropdown } from './NotificationDropdown'
import { UnreadMessageBadge } from './UnreadMessageBadge'
import { GlobalSearchTrigger } from './GlobalSearchTrigger'


export async function AppHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userProfile = null
    if (user) {
        userProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, avatarUrl: true, username: true, fullName: true }
        })
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b border-neutral-200/50 bg-white/60 backdrop-blur-xl dark:bg-neutral-900/60 dark:border-neutral-800/50">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left: Logo & Mobile Profile */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-900 dark:text-emerald-400 font-heading">
                        <img src="/logo-light.svg" alt="Gear-Pack" className="h-8 w-auto dark:hidden" />
                        <img src="/logo-dark.svg" alt="Gear-Pack" className="hidden h-8 w-auto dark:block" />
                    </Link>
                </div>

                {/* Center: Search (Hidden on small mobile, visible on larger screens) */}
                <div className="hidden flex-1 items-center justify-center px-6 md:flex">
                    {userProfile && <GlobalSearchTrigger currentUserId={userProfile.id} />}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">

                    {userProfile && <NotificationDropdown userId={userProfile.id} />}

                    {userProfile && <UnreadMessageBadge userId={userProfile.id} />}
                    {!userProfile && (
                        <Link href="/dashboard/messages" className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:hover:bg-neutral-800">
                            <span className="sr-only">Messages</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                        </Link>
                    )}

                    <ProfileDropdown user={userProfile} />
                </div>
            </div>
        </header>
    )
}

