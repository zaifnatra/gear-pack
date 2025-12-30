'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
    const navItems = [
        { label: 'Home', href: '/dashboard', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
        { label: 'Trips', href: '/dashboard/trips', icon: <><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M15 11v.01" /></> },
        { label: 'Social', href: '/dashboard/social', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
        { label: 'Gear Closet', href: '/dashboard/gear', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></> },
    ]

    // Helper to determine if a link is active
    const pathname = usePathname()
    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname !== '/dashboard') return false
        return pathname?.startsWith(href)
    }

    return (
        <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-neutral-200/50 bg-white/60 backdrop-blur-xl py-6 dark:bg-neutral-900/60 dark:border-neutral-800/50 md:flex">
            <div className="px-6 mb-8">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-heading">Menu</h2>
            </div>
            <nav className="flex-1 space-y-2 px-4">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                                ? 'bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-100 dark:shadow-none'
                                : 'text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-colors ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300'}`}>
                                {item.icon}
                            </svg>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>



        </aside>
    )
}
