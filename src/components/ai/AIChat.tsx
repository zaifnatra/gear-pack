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
import { Bot, Send, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message extends ChatResponse {
    id: string
    type: 'text' | 'tool'
    timestamp: Date
}

interface AIChatProps {
    mode?: 'floating' | 'full'
}

export function AIChat({ mode = 'floating' }: AIChatProps) {
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

    // Handle URL-based opening (Only for floating mode)
    useEffect(() => {
        if (mode === 'floating' && searchParams?.get('chat') === 'open') {
            setIsOpen(true)
        }
    }, [searchParams, mode])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open && mode === 'floating' && searchParams?.get('chat') === 'open') {
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete('chat')
            router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
        }
    }

    // Scroll when messages update
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
    }, [messages, isOpen, mode]);

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

    const handleQuickAction = (value: string) => {
        handleSend(value)
    }

    const handleTrailSelect = (trailId: string) => {
        handleSend(`I would like to select trail ID: ${trailId}. Please help me plan dates.`)
    }

    // --- Content Renderer function to be used by both modes ---
    const renderChatContent = () => (
        <>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {msg.role === 'assistant' && (
                        <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 self-start mt-1">
                            <Bot className="h-4 w-4" />
                        </div>
                    )}

                    <div className={`flex max-w-[85%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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

                        {msg.isJSON && (
                            <div className="w-full space-y-3 mt-2">
                                {msg.message && (
                                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-800 border border-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700 shadow-sm ring-1 ring-black/5">
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                    </div>
                                )}
                                {msg.data?.type === 'trail_options' && msg.data?.options && (
                                    <div className="flex w-full flex-col gap-2">
                                        {msg.data.options.map((trail: TrailOption) => (
                                            <div key={trail.id} className="origin-left animate-in fade-in slide-in-from-left-2 duration-300">
                                                <TrailCard trail={trail} onSelect={handleTrailSelect} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {msg.data?.type === 'gear_analysis' && msg.data && (
                                    <div className="w-full overflow-hidden rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                                        <GearAnalysis data={msg.data} />
                                    </div>
                                )}
                            </div>
                        )}

                        {msg.quickActions && msg.quickActions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in duration-500 delay-150">
                                <QuickActions actions={msg.quickActions} onAction={handleQuickAction} disabled={isLoading} />
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
        </>
    )

    const renderInputArea = () => (
        <div className={cn("relative flex items-center w-full transition-all duration-200 focus-within:ring-2 focus-within:ring-neutral-900/10 dark:focus-within:ring-white/10 rounded-full shadow-sm", mode === 'full' && "max-w-4xl mx-auto")}>
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
                {/* Send Icon */}
                <ArrowUp className="h-4 w-4" />
            </button>
        </div>
    )

    if (mode === 'full') {
        return (
            <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] md:h-[calc(100vh-theme(spacing.24))] relative">
                {/* Header */}
                <div className="flex-none px-4 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">PackBot AI</h1>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Your personal gear & trip assistant</p>
                        </div>
                    </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {renderChatContent()}
                    </div>
                </div>

                {/* Footer Input */}
                <div className="flex-none px-4 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
                    {renderInputArea()}
                    <div className="mt-2 text-center">
                        <p className="text-[10px] text-neutral-400">AI can make mistakes. Check important info.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ExpandableChat
            size="md"
            position="bottom-right"
            icon={<Bot className="h-6 w-6" />}
            isOpen={isOpen}
            onOpenChange={handleOpenChange}
            className="border-none shadow-2xl"
        >
            <ExpandableChatHeader className="flex-col items-start gap-0.5 px-6 py-5 bg-transparent border-none">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-900 dark:text-neutral-100 tracking-tight">
                    PackBot AI
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Your personal gear & trip assistant</p>
            </ExpandableChatHeader>

            <ExpandableChatBody className="px-6 py-0 space-y-6 bg-transparent scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-300 dark:hover:scrollbar-thumb-neutral-700">
                {renderChatContent()}
            </ExpandableChatBody>

            <ExpandableChatFooter className="p-4 bg-transparent border-none">
                {renderInputArea()}
                <div className="mt-2 text-center">
                    <p className="text-[10px] text-neutral-400">AI can make mistakes. Check important info.</p>
                </div>
            </ExpandableChatFooter>
        </ExpandableChat>
    )
}
