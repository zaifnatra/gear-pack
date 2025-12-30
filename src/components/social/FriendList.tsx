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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {friends.map((friend) => (
                <Link
                    key={friend.id}
                    href={`/dashboard/social/${friend.id}/closet`}
                    className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                >
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-500">
                                {friend.username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{friend.fullName || friend.username}</p>
                        <p className="text-xs text-neutral-500">@{friend.username}</p>
                        <p className="text-[10px] text-emerald-600 mt-1 font-medium">View Gear Closet &rarr;</p>
                    </div>
                </Link>
            ))}
        </div>
    )
}
