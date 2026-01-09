import Link from 'next/link'

interface FriendListProps {
    friends: any[]
}

export function FriendList({ friends }: FriendListProps) {
    if (!friends || friends.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50">
                You haven't added any friends yet. Use the search to find people!
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {friends.map((friend) => (
                <Link
                    key={friend.id}
                    href={`/dashboard/social/${friend.id}/closet`}
                    className="flex flex-col items-center justify-center text-center gap-4 rounded-3xl border border-neutral-200 bg-white p-8 transition-all hover:shadow-xl hover:scale-[1.02] dark:border-neutral-800 dark:bg-neutral-900 min-h-[250px]"
                >
                    <div className="h-24 w-24 overflow-hidden rounded-full bg-neutral-100 ring-4 ring-neutral-50 dark:bg-neutral-800 dark:ring-neutral-800">
                        {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-400">
                                {friend.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{friend.fullName || friend.username}</p>
                        <p className="text-sm font-medium text-neutral-500">@{friend.username}</p>
                    </div>
                    <div className="mt-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                        View Gear Closet
                    </div>
                </Link>
            ))}
        </div>
    )
}
