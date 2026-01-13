'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
    const navItems = [
        { label: 'Home', href: '/dashboard', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
        { label: 'Trips', href: '/dashboard/trips', icon: <><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M15 11v.01" /></> },

        // AI Center Button
        { label: 'AI', href: '?chat=open', icon: <><rect width="18" height="10" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" x2="8" y1="16" y2="16" /><line x1="16" x2="16" y1="16" y2="16" /></> },

        { label: 'Closet', href: '/dashboard/gear', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></> },
        { label: 'Social', href: '/dashboard/social', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
    ]

    // Helper to determine if a link is active
    const pathname = usePathname()
    const isActive = (href: string) => {
        if (href === '/dashboard' && pathname !== '/dashboard') return false
        return pathname?.startsWith(href)
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pt-1 pb-safe md:hidden dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
            <div className="flex h-16 items-center justify-around">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${active
                                ? 'text-neutral-900 dark:text-white'
                                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-6 w-6 ${active ? 'fill-neutral-100 dark:fill-neutral-800' : ''}`}>
                                {item.icon}
                            </svg>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
