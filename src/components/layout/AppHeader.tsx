import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ProfileDropdown } from './ProfileDropdown'

export async function AppHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userProfile = null
    if (user) {
        userProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: { avatarUrl: true, username: true, fullName: true }
        })
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Left: Logo & Mobile Profile */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                            <path d="m19 11-8-8-8 8" /><path d="M20 12h-4l-3 9L9 12H4l8-8Z" />
                        </svg>
                        <span>GearPack</span>
                    </Link>
                </div>

                {/* Center: Search (Hidden on small mobile, visible on larger screens) */}
                <div className="hidden flex-1 items-center justify-center px-6 md:flex">
                    <div className="relative w-full max-w-md">
                        <div className="absolute left-2.5 top-2.5 text-neutral-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                        <input
                            type="search"
                            placeholder="Search gear, trips, people..."
                            className="h-9 w-full rounded-md border border-neutral-200 bg-neutral-100 pl-9 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-neutral-800 dark:bg-neutral-800"
                        />
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <button className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <span className="sr-only">Notifications</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </button>

                    <button className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <span className="sr-only">Messages</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    </button>

                    <ProfileDropdown user={userProfile} />
                </div>
            </div>
        </header>
    )
}
