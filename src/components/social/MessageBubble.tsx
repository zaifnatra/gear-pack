'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, Reply, Smile, MoreHorizontal, Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Reaction {
    emoji: string
    user: { id: string, username: string }
}

interface Message {
    id: string
    content: string
    senderId: string
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
    sender: {
        id: string
        username: string
        fullName: string | null
        avatarUrl: string | null
    }
    replyTo?: {
        id: string
        content: string
        sender: { username: string }
    } | null
    reactions: Reaction[]
}

interface MessageBubbleProps {
    message: Message
    isMe: boolean
    isGroup: boolean
    showAvatar: boolean
    onReply: (message: Message) => void
    onEdit: (message: Message) => void
    onDelete: (message: Message) => void
    onReact: (messageId: string, emoji: string) => void
}

export function MessageBubble({
    message,
    isMe,
    isGroup,
    showAvatar,
    onReply,
    onEdit,
    onDelete,
    onReact
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false)
    const isDeleted = !!message.deletedAt

    const reactionMap = message.reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div
            className={cn(
                "group flex gap-3 mb-1 w-full",
                isMe ? "justify-end" : "justify-start"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar (Left) */}
            {!isMe && (
                <div className="h-8 w-8 flex-shrink-0 flex flex-col justify-end">
                    {showAvatar ? (
                        message.sender.avatarUrl ? (
                            <img src={message.sender.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt={message.sender.username} />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                {message.sender.username.substring(0, 2).toUpperCase()}
                            </div>
                        )
                    ) : (
                        <div className="w-8" />
                    )}
                </div>
            )}

            <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                {/* Sender Name (Group only) */}
                {!isMe && showAvatar && isGroup && (
                    <span className="ml-1 mb-0.5 text-[10px] font-bold text-neutral-400">
                        {message.sender.fullName || message.sender.username}
                    </span>
                )}

                {/* Container for Bubble + Actions */}
                <div className={cn("relative flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>

                    {/* Message Content */}
                    <div className="flex flex-col">
                        {/* Reply Context */}
                        {message.replyTo && (
                            <div className={cn(
                                "mb-1 flex items-center gap-2 rounded-lg border-l-2 px-3 py-1 text-xs opacity-75 transition-all hover:opacity-100",
                                isMe
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 mr-1"
                                    : "border-neutral-200 bg-neutral-100/50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-400 ml-1"
                            )}>
                                <Reply className="h-3 w-3" />
                                <span className="font-bold">{message.replyTo.sender.username}</span>
                                <span className="truncate max-w-[150px] italic">
                                    {message.replyTo.content}
                                </span>
                            </div>
                        )}

                        <div
                            className={cn(
                                "relative px-4 py-2 text-[15px] leading-relaxed shadow-sm transition-all",
                                isMe
                                    ? "bg-emerald-600 text-white rounded-[1.25rem] rounded-tr-sm"
                                    : "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 rounded-[1.25rem] rounded-tl-sm border border-neutral-100 dark:border-neutral-700",
                                isDeleted && "italic opacity-80 bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500 border-none shadow-none"
                            )}
                        >
                            {message.content}

                            {/* Meta Info (Time + Edited + Read) */}
                            <div className={cn(
                                "mt-1 flex items-center gap-1 text-[10px] opacity-70",
                                isMe ? "justify-end text-emerald-100" : "justify-start text-neutral-400"
                            )}>
                                <span>{format(new Date(message.createdAt), 'h:mm a')}</span>
                                {message.updatedAt > message.createdAt && !isDeleted && <span>(edited)</span>}
                            </div>
                        </div>

                        {/* Reactions */}
                        {Object.keys(reactionMap).length > 0 && (
                            <div className={cn("mt-1 flex flex-wrap gap-1", isMe ? "justify-end" : "justify-start")}>
                                {Object.entries(reactionMap).map(([emoji, count]) => {
                                    const hasReacted = message.reactions.some(r => r.emoji === emoji && r.user.id === message.senderId) // Checks if sender reacted? No, check if *I* reacted needs currentUserId in prop. 
                                    // For now just show counts.
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => onReact(message.id, emoji)}
                                            className={cn(
                                                "flex items-center gap-1 rounded-full border bg-white px-1.5 py-0.5 text-[10px] font-medium shadow-sm transition-colors dark:bg-neutral-800",
                                                "border-neutral-200 hover:border-emerald-300 dark:border-neutral-700 dark:hover:border-emerald-700"
                                            )}
                                        >
                                            <span>{emoji}</span>
                                            <span className="text-neutral-500 dark:text-neutral-400">{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Hover Actions */}
                    {!isDeleted && (
                        <div className={cn(
                            "opacity-0 transition-opacity duration-200 flex items-center gap-1",
                            showActions ? "opacity-100" : "opacity-0"
                        )}>
                            <ActionsButton onClick={() => onReact(message.id, '❤️')} icon={<Smile className="h-4 w-4" />} label="React" />
                            <ActionsButton onClick={() => onReply(message)} icon={<Reply className="h-4 w-4" />} label="Reply" />
                            {isMe && (
                                <>
                                    <ActionsButton onClick={() => onEdit(message)} icon={<Edit2 className="h-4 w-4" />} label="Edit" />
                                    <ActionsButton onClick={() => onDelete(message)} icon={<Trash2 className="h-4 w-4 text-red-500" />} label="Delete" />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ActionsButton({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="rounded-full bg-neutral-100 p-1.5 text-neutral-500 hover:bg-white hover:text-emerald-600 hover:shadow-sm dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-emerald-400 transition-all"
        >
            {icon}
        </button>
    )
}
