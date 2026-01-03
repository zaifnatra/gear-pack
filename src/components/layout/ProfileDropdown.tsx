'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { useTheme } from 'next-themes'

import Image from 'next/image'

interface ProfileDropdownProps {
    user: {
        fullName: string | null
        username: string
        avatarUrl: string | null
    } | null
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { theme, setTheme } = useTheme()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleSignOut = () => {
        startTransition(() => {
            signOut()
        })
    }

    const displayName = user?.fullName || user?.username || 'User'
    const initial = displayName[0].toUpperCase()

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative h-8 w-8 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 hover:ring-2 hover:ring-emerald-500/50 dark:border-neutral-700 dark:bg-neutral-800"
            >
                {user?.avatarUrl ? (
                    <Image
                        src={user.avatarUrl}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="32px"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500">
                        {initial}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-neutral-900 dark:ring-neutral-800">
                    <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        onClick={() => setIsOpen(false)}
                    >
                        Your Profile
                    </Link>
                    <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                        onClick={() => setIsOpen(false)}
                    >
                        Settings
                    </Link>
                    <button
                        onClick={() => {
                            setTheme(theme === 'dark' ? 'light' : 'dark')
                            setIsOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    <button
                        onClick={handleSignOut}
                        disabled={isPending}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        {isPending ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            )}
        </div>
    )
}
