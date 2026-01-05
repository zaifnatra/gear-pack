'use client'

import { useRef, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { getChatHistory, sendAIMessage, ChatResponse } from '@/app/actions/ai-chat'
import { TrailCard, TrailOption } from './TrailCard'
import { QuickActions, QuickAction } from './QuickActions'
import { GearAnalysis, GearAnalysisData } from './GearAnalysis'

interface Message extends ChatResponse {
    id: string
    type: 'text' | 'tool'
    content: string
    timestamp: Date
}

export function AIChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

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
                        content: h.message,
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
                        content: "Hi! I'm PackBot 🎒. I can help you find trails, plan trips, and build packing lists. How can I help you today?",
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

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            type: 'text',
            content: text,
            timestamp: new Date(),
            isJSON: false
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const response = await sendAIMessage(text)

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                type: 'text',
                content: response.message,
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
                content: "Sorry, I ran into an error. Please try again.",
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
        <div className="flex h-full flex-col bg-slate-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden font-sans">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>

                        {/* Avatar for Assistant */}
                        {msg.role === 'assistant' && (
                            <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-lg shadow-sm border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800">
                                🎒
                            </div>
                        )}

                        <div className={`flex max-w-[90%] md:max-w-[75%] flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Message Bubble */}
                            {!msg.isJSON && (
                                <div className={`rounded-2xl px-5 py-3.5 shadow-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-neutral-800 border border-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800 rounded-tl-none'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <div className="markdown-content text-[15px] leading-relaxed">
                                            <ReactMarkdown
                                                components={{
                                                    h2: ({ ...props }) => <h2 className="text-sm font-bold mt-4 mb-2 uppercase tracking-wide opacity-80" {...props} />,
                                                    ul: ({ ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                                                    ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                                                    li: ({ ...props }) => <li className="my-0.5" {...props} />,
                                                    p: ({ ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                                    strong: ({ ...props }) => <strong className="font-semibold text-inherit" {...props} />,
                                                    code: ({ ...props }) => <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Rich Content Wrapper */}
                        {msg.isJSON && (
                            <div className="w-full space-y-4">
                                {/* Text Content if any */}
                                {msg.content && (
                                    <div className="rounded-2xl bg-white px-5 py-3.5 text-neutral-800 border border-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-800 rounded-tl-none">
                                        <p className="whitespace-pre-wrap text-[15px]">{msg.content}</p>
                                    </div>
                                )}

                                {/* Trail Options Carousel */}
                                {msg.data?.type === 'trail_options' && msg.data?.options && (
                                    <div className="mt-2 flex w-full flex-col gap-4">
                                        {msg.data.options.map((trail: TrailOption) => (
                                            <TrailCard
                                                key={trail.id}
                                                trail={trail}
                                                onSelect={handleTrailSelect}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Gear Analysis */}
                                {msg.data?.type === 'gear_analysis' && msg.data && (
                                    <div className="mt-2 w-full">
                                        <GearAnalysis data={msg.data} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Quick Actions */}
                        {msg.quickActions && msg.quickActions.length > 0 && (
                            <div className="mt-2">
                                <QuickActions
                                    actions={msg.quickActions}
                                    onAction={handleQuickAction}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        {/* Timestamp */}
                        <span className="mt-2 text-[10px] font-medium text-neutral-400 opacity-60">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start gap-4 animate-in fade-in duration-300">
                        <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-lg shadow-sm border border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800">
                            🎒
                        </div>
                        <div className="flex items-center space-x-1.5 rounded-2xl bg-white px-4 py-3 border border-neutral-100 dark:bg-neutral-900 dark:border-neutral-800 shadow-sm rounded-tl-none">
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]"></div>
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]"></div>
                            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 dark:bg-neutral-950 border-t border-neutral-200/60 dark:border-neutral-800">
                <div className="mx-auto max-w-4xl flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask PackBot..."
                        disabled={isLoading}
                        className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:focus:bg-neutral-900"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="flex items-center justify-center rounded-xl bg-blue-600 px-4 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    </button>
                </div>
            </div>
        </div >
    )
}
