'use client'

import { useState } from 'react'
import { UserSearch } from './UserSearch'
import { FriendRequests } from './FriendRequests'
import { FriendList } from './FriendList'
import { SentRequests } from './SentRequests'

interface SocialDashboardViewProps {
    friends: any[]
    requests: any[]
    sentRequests: any[]
    userId: string
}

export function SocialDashboardView({ friends, requests, sentRequests, userId }: SocialDashboardViewProps) {
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
    const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received')

    return (
        <div className="space-y-6">
            {/* ... Header ... */}
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-2xl shadow-black/20 min-h-[200px] flex flex-col justify-end group">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/header3.jpg"
                        alt="Social Background"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-4xl font-black font-heading tracking-tight drop-shadow-sm mb-2">Social Hub</h1>
                    <p className="text-neutral-200 text-lg font-medium drop-shadow-sm max-w-xl">
                        Connect with other hikers, share gear lists, and coordinate group trips.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'friends'
                        ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                        }`}
                >
                    Friends
                    <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{friends.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'requests'
                        ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                        }`}
                >
                    Requests
                    {(requests.length > 0 || sentRequests.length > 0) && (
                        <span className="ml-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {requests.length + sentRequests.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'search'
                        ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                        }`}
                >
                    Find People
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'friends' && <FriendList friends={friends} />}

                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRequestSubTab('received')}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${requestSubTab === 'received'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
                            >
                                Received ({requests.length})
                            </button>
                            <button
                                onClick={() => setRequestSubTab('sent')}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${requestSubTab === 'sent'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
                            >
                                Sent ({sentRequests.length})
                            </button>
                        </div>

                        {requestSubTab === 'received' ? (
                            <FriendRequests requests={requests} />
                        ) : (
                            <SentRequests requests={sentRequests} currentUserId={userId} />
                        )}
                    </div>
                )}

                {activeTab === 'search' && <UserSearch currentUserId={userId} />}
            </div>
        </div>
    )
}
