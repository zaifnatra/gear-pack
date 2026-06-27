'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialAvatarProps {
    src?: string | null
    name?: string | null
    isGroup?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeClasses = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-10 w-10 text-sm'
}

const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-[18px] w-[18px]'
}

function getInitials(name?: string | null) {
    const fallback = 'U'
    if (!name) return fallback

    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return fallback
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function SocialAvatar({ src, name, isGroup = false, size = 'md', className }: SocialAvatarProps) {
    const [imageFailed, setImageFailed] = useState(false)
    const showImage = !!src && !imageFailed

    useEffect(() => {
        setImageFailed(false)
    }, [src])

    return (
        <div
            className={cn(
                'flex shrink-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-200 dark:border-neutral-700',
                sizeClasses[size],
                className
            )}
        >
            {showImage ? (
                <img
                    src={src}
                    alt={name || 'User avatar'}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-100 font-bold text-emerald-600 dark:bg-emerald-900/30">
                    {isGroup ? <Users className={iconSizes[size]} /> : getInitials(name)}
                </div>
            )}
        </div>
    )
}
