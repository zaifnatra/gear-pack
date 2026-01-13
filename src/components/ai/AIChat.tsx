'use client'

import { useRef, useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { getChatHistory, sendAIMessage, ChatResponse } from '@/app/actions/ai-chat'
import { TrailCard, TrailOption } from './TrailCard'
import { QuickActions, QuickAction } from './QuickActions'
import { GearAnalysis, GearAnalysisData } from './GearAnalysis'
import {
    ExpandableChat,
    ExpandableChatHeader,
    ExpandableChatBody,
    ExpandableChatFooter,
} from "@/components/ui/expandable-chat";
import { Bot } from 'lucide-react'

interface Message extends ChatResponse {
    id: string
    type: 'text' | 'tool'
    timestamp: Date
}

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Handle URL-based opening + Close on route change
    useEffect(() => {
        if (searchParams?.get('chat') === 'open') {
            setIsOpen(true)
        }
    }, [searchParams])

    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        // If closing, and URL has param, remove it to prevent stuck state
        if (!open && searchParams?.get('chat') === 'open') {
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('chat')
            router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
        }
    }

    // Scroll when messages update
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages, isOpen]);

    // Close on click outside
    const chatRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (isOpen && chatRef.current && !chatRef.current.contains(event.target as Node)) {
                // Check if the click was on a toggle button/trigger that we shouldn't interfere with?
                // For now, simpler is better.
                handleOpenChange(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    // Load history on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await getChatHistory()
                if (history && history.length > 0) {
                    setMessages(history.map((h, i) => ({
                        id: `hist-${i}`,
                        role: h.role as 'user' | 'assistant',
                        type: 'text',
                        message: h.message,
                        timestamp: new Date(),
                        isJSON: h.isJSON,
                        data: h.data,
                        quickActions: h.quickActions
                    })))
                } else {
                    setMessages([{
                        id: 'init',
                        role: 'assistant',
                        type: 'text',
                        message: "Hi! I'm PackBot 🎒. I can help you find trails, plan trips, and build packing lists. How can I help you today?",
                        timestamp: new Date(),
                        isJSON: false,
                        quickActions: [
                            { label: "Find a hike nearby", value: "Find a hike nearby" },
                            { label: "Plan a weekend trip", value: "Plan a weekend trip" }
                        ]
                    }])
                }
            } catch (e) {
                console.error("Failed to load history", e)
            }
        }
        loadHistory()
    }, [])

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return

        const userText = text.trim();
        setInput('') // Clear immediately for better UX

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            type: 'text',
            message: userText,
            timestamp: new Date(),
            isJSON: false
        }

        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)

        try {
            const response = await sendAIMessage(userText)

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'text',
                message: response.message,
                timestamp: new Date(),
                isJSON: response.isJSON,
                data: response.data,
                quickActions: response.quickActions
            }
            setMessages(prev => [...prev, aiMsg])
            router.refresh() // Refresh UI to show any changes (trips, gear, etc.)
        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                type: 'text',
                message: "Sorry, I ran into an error. Please try again.",
                timestamp: new Date(),
                isJSON: false
            }])
        } finally {
            setIsLoading(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    // Handle Quick Action Click
    const handleQuickAction = (value: string) => {
        handleSend(value)
    }

    // Handle Trail Selection
    const handleTrailSelect = (trailId: string) => {
        handleSend(`I would like to select trail ID: ${trailId}. Please help me plan dates.`)
    }

    return (
        <ExpandableChat
            size="md"
            position="bottom-right"
            icon={<Bot className="h-6 w-6" />}
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
            className="border-none shadow-2xl" // External override if needed, but component handles it.
        >
            <ExpandableChatHeader className="flex-col items-start gap-0.5 px-6 py-5 bg-transparent border-none">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100 tracking-tight">
                    PackBot AI
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Your personal gear & trip assistant</p>
            </ExpandableChatHeader>

            <ExpandableChatBody className="px-6 py-0 space-y-6 bg-transparent scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-300 dark:hover:scrollbar-thumb-neutral-700">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        {/* Avatar for Assistant - Minimal Dot/Icon */}
                        {msg.role === 'assistant' && (
                            <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 self-start mt-1">
                                <Bot className="h-4 w-4" />
                            </div>
                        )}

                        <div className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            {/* Message Bubble */}
                            {!msg.isJSON && (
                                <div className={`px-4 py-2.5 text-[0.9375rem] leading-relaxed shadow-sm transition-all duration-200 ${msg.role === 'user'
                                    ? 'bg-neutral-900 text-white rounded-[1.25rem] rounded-tr-sm'
                                    : 'bg-white text-neutral-800 border border-neutral-100/50 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700 rounded-[1.25rem] rounded-tl-sm ring-1 ring-black/5'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                    ) : (
                                        <div className="markdown-content">
                                            <ReactMarkdown
                                                components={{
                                                    h2: ({ ...props }) => <h2 className="font-bold mt-3 mb-2 text-base text-neutral-900 dark:text-neutral-100" {...props} />,
                                                    ul: ({ ...props }) => <ul className="list-disc pl-4 my-2 space-y-1 text-neutral-600 dark:text-neutral-300" {...props} />,
                                                    ol: ({ ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1 text-neutral-600 dark:text-neutral-300" {...props} />,
                                                    p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    strong: ({ ...props }) => <strong className="font-semibold text-neutral-900 dark:text-white" {...props} />,
                                                    code: ({ ...props }) => <code className="bg-neutral-100 dark:bg-neutral-900 px-1 py-0.5 rounded text-xs font-mono text-neutral-800 dark:text-neutral-200" {...props} />,
                                                }}
                                            >
                                                {msg.message}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Rich Content Wrapper - Cards */}
                            {msg.isJSON && (
                                <div className="w-full space-y-3 mt-2">
                                    {/* Text Content */}
                                    {msg.message && (
                                        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-800 border border-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 shadow-sm ring-1 ring-black/5">
                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                        </div>
                                    )}

                                    {/* Trail Options Carousel */}
                                    {msg.data?.type === 'trail_options' && msg.data?.options && (
                                        <div className="flex w-full flex-col gap-2">
                                            {msg.data.options.map((trail: TrailOption) => (
                                                <div key={trail.id} className="origin-left animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <TrailCard
                                                        trail={trail}
                                                        onSelect={handleTrailSelect}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Gear Analysis */}
                                    {msg.data?.type === 'gear_analysis' && msg.data && (
                                        <div className="w-full overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                            <GearAnalysis data={msg.data} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Actions */}
                            {msg.quickActions && msg.quickActions.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in duration-500 delay-150">
                                    <QuickActions
                                        actions={msg.quickActions}
                                        onAction={handleQuickAction}
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start gap-3 animate-in fade-in duration-300">
                        <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 mt-1">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="flex items-center space-x-1 px-4 py-3 bg-white border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 shadow-sm rounded-2xl rounded-tl-sm h-10">
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]"></div>
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]"></div>
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
            </ExpandableChatBody>

            <ExpandableChatFooter className="p-4 bg-transparent border-none">
                <div className="relative flex items-center w-full transition-all duration-200 focus-within:ring-2 focus-within:ring-neutral-900/10 dark:focus-within:ring-white/10 rounded-full shadow-sm">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        className="flex-1 w-full pl-5 pr-12 py-3.5 bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-full text-sm placeholder:text-neutral-400 focus:outline-none focus:border-neutral-300 dark:focus:border-neutral-700 transition-colors"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 active:scale-95 disabled:opacity-0 disabled:scale-75 transition-all duration-200 ease-out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-neutral-400">AI can make mistakes. Check important info.</p>
                </div>
            </ExpandableChatFooter>
        </ExpandableChat>
    )
}
