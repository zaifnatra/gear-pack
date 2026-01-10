'use client'

import { useState, useEffect, useRef } from 'react'
import { sendMessage, getConversations, getMessages, createConversation, markAsRead, editMessage, deleteMessage, reactToMessage, archiveConversation } from '@/app/actions/messages'
import { getFriends } from '@/app/actions/social'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { MessageBubble } from './MessageBubble'
import { X, Reply, Archive } from 'lucide-react'

interface ChatInterfaceProps {
    currentUserId: string
}

export function ChatInterface({ currentUserId }: ChatInterfaceProps) {
    const [activeConversation, setActiveConversation] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [conversations, setConversations] = useState<any[]>([])

    // Rich Messaging State
    const [replyingTo, setReplyingTo] = useState<any>(null)
    const [editingMessage, setEditingMessage] = useState<any>(null)

    // New Chat State
    const [view, setView] = useState<'conversations' | 'new-chat'>('conversations')
    const [friends, setFriends] = useState<any[]>([])
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
    const [groupName, setGroupName] = useState('')

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initial Load
    useEffect(() => {
        loadConversations()
        loadFriends()
    }, [])

    // Poll for messages in active chat
    useEffect(() => {
        if (!activeConversation) return

        refreshMessages()
        // Mark as read immediately on open
        markAsRead(activeConversation.id, currentUserId)

        const interval = setInterval(() => {
            refreshMessages(true)
        }, 3000)

        return () => clearInterval(interval)
    }, [activeConversation])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, replyingTo, editingMessage])

    async function loadConversations() {
        const res = await getConversations(currentUserId)
        if (res.success && res.data) {
            setConversations(res.data)
        }
    }

    async function loadFriends() {
        const res = await getFriends(currentUserId)
        if (res.success && res.data) {
            setFriends(res.data)
        }
    }

    async function refreshMessages(background = false) {
        if (!activeConversation) return
        const res = await getMessages(activeConversation.id)
        if (res.success && res.data) {
            setMessages(res.data)
            if (!background) {
                // Refresh list to update "last message" snippet or unread counts if we were tracking them
                loadConversations()
            }
        }
    }

    async function handleCreateConversation() {
        if (selectedFriendIds.length === 0) return

        const res = await createConversation(currentUserId, selectedFriendIds, groupName)
        if (res.success && res.data) {
            setActiveConversation(res.data)
            setView('conversations')
            setSelectedFriendIds([])
            setGroupName('')
            loadConversations()
        } else {
            toast.error('Failed to start chat')
        }
    }

    async function handleSend() {
        if (!newMessage.trim() || !activeConversation) return

        const content = newMessage
        setNewMessage('') // Optimistic clear
        setReplyingTo(null)
        setEditingMessage(null)

        if (editingMessage) {
            const res = await editMessage(editingMessage.id, currentUserId, content)
            if (!res.success) toast.error('Failed to edit')
            else refreshMessages()
        } else {
            const res = await sendMessage(activeConversation.id, currentUserId, content, replyingTo?.id)
            if (!res.success) toast.error('Failed to send')
            else refreshMessages()
        }
    }

    const handleReply = (msg: any) => {
        setReplyingTo(msg)
        setEditingMessage(null)
        inputRef.current?.focus()
    }

    const handleEdit = (msg: any) => {
        setEditingMessage(msg)
        setReplyingTo(null)
        setNewMessage(msg.content)
        inputRef.current?.focus()
    }

    const handleDelete = async (msg: any) => {
        toast.promise(deleteMessage(msg.id, currentUserId), {
            loading: 'Deleting message...',
            success: () => {
                refreshMessages()
                return 'Message deleted'
            },
            error: 'Failed to delete'
        })
    }

    const handleReact = async (msgId: string, emoji: string) => {
        const res = await reactToMessage(msgId, currentUserId, emoji)
        if (res.success) refreshMessages()
    }

    const handleArchive = async (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation() // Prevent opening chat
        toast.promise(archiveConversation(conversationId, currentUserId), {
            loading: 'Archiving chat...',
            success: () => {
                loadConversations()
                setActiveConversation(null)
                return 'Conversation archived'
            },
            error: 'Failed to archive'
        })
    }

    const cancelAction = () => {
        setReplyingTo(null)
        setEditingMessage(null)
        setNewMessage('')
    }

    // Toggle friend selection for new chat
    const toggleFriendSelection = (friendId: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        )
    }

    // Helper to get conversation name/avatar
    const getConversationMeta = (conv: any) => {
        if (conv.isGroup) {
            return {
                name: conv.name || 'Group Chat',
                avatar: null,
                isGroup: true
            }
        }
        // DM: Find the other user
        const otherParticipant = conv.participants.find((p: any) => p.user.id !== currentUserId)
        return {
            name: otherParticipant?.user.fullName || otherParticipant?.user.username || 'Unknown',
            avatar: otherParticipant?.user.avatarUrl,
            isGroup: false
        }
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm">
            {/* Sidebar */}
            <div className={`w-full flex-col border-r border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/50 md:flex md:w-80 ${activeConversation ? 'hidden' : 'flex'}`}>
                <div className="border-b border-neutral-200 p-4 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="font-heading font-semibold text-neutral-900 dark:text-neutral-100">Messages</h2>
                    <button
                        onClick={() => {
                            setView(view === 'conversations' ? 'new-chat' : 'conversations');
                            setSelectedFriendIds([]);
                        }}
                        className="rounded-full p-2 hover:bg-white dark:hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                        {view === 'conversations' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-8m0 0V4m0 8h8m-8 0H4" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {view === 'new-chat' ? (
                        <div className="space-y-4 p-2">
                            <div>
                                <h3 className="text-xs font-semibold uppercase text-neutral-500 mb-2">Select People</h3>
                                <div className="space-y-1">
                                    {friends.map(friend => {
                                        const isSelected = selectedFriendIds.includes(friend.id)
                                        return (
                                            <div
                                                key={friend.id}
                                                onClick={() => toggleFriendSelection(friend.id)}
                                                className={`flex w-full items-center gap-3 rounded-xl p-2 transition-all cursor-pointer ${isSelected
                                                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100'
                                                    : 'hover:bg-white dark:hover:bg-neutral-800'
                                                    }`}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="h-8 w-8 overflow-hidden rounded-full bg-neutral-200">
                                                    {friend.avatarUrl && <img src={friend.avatarUrl} className="h-full w-full object-cover" />}
                                                </div>
                                                <span className="text-sm font-medium">{friend.fullName || friend.username}</span>
                                                {isSelected && (
                                                    <div className="ml-auto text-emerald-600 dark:text-emerald-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {selectedFriendIds.length > 1 && (
                                <div>
                                    <label className="text-xs font-semibold uppercase text-neutral-500 mb-2 block">Group Name (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Weekend Hike"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800"
                                    />
                                </div>
                            )}

                            {selectedFriendIds.length > 0 && (
                                <button
                                    onClick={handleCreateConversation}
                                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
                                >
                                    Start Chat ({selectedFriendIds.length})
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {conversations.length === 0 && <div className="p-8 text-center text-sm text-neutral-500">No conversations yet.</div>}
                            {conversations.map(conv => {
                                const meta = getConversationMeta(conv)
                                const lastMsg = conv.messages?.[0]
                                const myParticipant = conv.participants.find((p: any) => p.userId === currentUserId)
                                const isUnread = lastMsg && myParticipant && (!myParticipant.lastReadAt || new Date(lastMsg.createdAt) > new Date(myParticipant.lastReadAt))
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversation(conv)}
                                        className={`group relative flex w-full items-start gap-3 rounded-2xl p-3 transition-all cursor-pointer ${activeConversation?.id === conv.id
                                            ? 'bg-white shadow-sm dark:bg-neutral-800'
                                            : 'hover:bg-white/50 dark:hover:bg-neutral-800/50'
                                            }`}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <button
                                            onClick={(e) => handleArchive(e, conv.id)}
                                            className="absolute right-2 top-2 rounded-full p-1.5 opacity-0 transition-opacity hover:bg-neutral-200 group-hover:opacity-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-red-500 z-10"
                                            title="Archive Conversation"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        <div className="relative h-10 w-10 flex-shrink-0">
                                            <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-200 border border-neutral-200 dark:border-neutral-700">
                                                {meta.avatar ? (
                                                    <img src={meta.avatar} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                                                        {meta.isGroup ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                        ) : (
                                                            <span className="text-sm font-bold">{meta.name.substring(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col items-start min-w-0">
                                            <div className="flex w-full items-center justify-between">
                                                <span className={`truncate text-sm ${isUnread ? 'font-bold text-neutral-900 dark:text-white' : 'font-bold text-neutral-900 dark:text-neutral-100'} font-heading`}>{meta.name}</span>
                                                {isUnread && (
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                                                )}
                                            </div>
                                            <span className={`truncate text-xs w-full text-left ${isUnread ? 'font-semibold text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                                                {lastMsg ? (
                                                    <span className={lastMsg.senderId === currentUserId ? 'text-neutral-400' : ''}>
                                                        {lastMsg.senderId === currentUserId && 'You: '}{lastMsg.content}
                                                    </span>
                                                ) : 'No messages'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex flex-1 flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'} bg-neutral-50/30 dark:bg-neutral-900/50`}>
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-neutral-200 bg-white/50 backdrop-blur-md p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden rounded-full p-1 hover:bg-neutral-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                {(() => {
                                    const meta = getConversationMeta(activeConversation)
                                    return (
                                        <>
                                            <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-200">
                                                {meta.avatar ? (
                                                    <img src={meta.avatar} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                                                        {meta.isGroup ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                        ) : (
                                                            <span className="text-xs font-bold">{meta.name.substring(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 font-heading">{meta.name}</h3>
                                                {meta.isGroup && (
                                                    <p className="text-xs text-neutral-500">{activeConversation.participants.length} participants</p>
                                                )}
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                            {messages.map((msg, i) => {
                                const isMe = msg.senderId === currentUserId
                                const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId) // Only first message of streak
                                const meta = getConversationMeta(activeConversation)

                                return (
                                    <MessageBubble
                                        key={msg.id || i}
                                        message={msg}
                                        isMe={isMe}
                                        isGroup={meta.isGroup}
                                        showAvatar={showAvatar}
                                        onReply={handleReply}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onReact={handleReact}
                                    />
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                            {/* Reply/Edit Context Banner */}
                            {(replyingTo || editingMessage) && (
                                <div className="mb-3 flex items-center justify-between rounded-lg border-l-4 border-emerald-500 bg-neutral-50 p-3 shadow-sm dark:bg-neutral-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            {editingMessage ? 'Editing Message' : `Replying to ${replyingTo.sender.username}`}
                                        </span>
                                        <span className="truncate text-sm text-neutral-600 dark:text-neutral-300 max-w-[300px]">
                                            {editingMessage ? editingMessage.content : replyingTo.content}
                                        </span>
                                    </div>
                                    <button onClick={cancelAction} className="rounded-full p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                                        <X className="h-4 w-4 text-neutral-500" />
                                    </button>
                                </div>
                            )}

                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2 items-center"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={editingMessage ? "Edit message..." : "Message..."}
                                    className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 transition-all font-medium"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="rounded-full bg-emerald-600 p-3 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-neutral-500">
                        <div className="mb-6 rounded-full bg-white p-6 shadow-sm dark:bg-neutral-800 ring-1 ring-neutral-200 dark:ring-neutral-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 font-heading">Your Messages</h3>
                        <p className="text-sm">Select a conversation or start a new group chat.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
