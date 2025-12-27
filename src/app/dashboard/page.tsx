export default function DashboardPage() {
    const activities = [
        {
            id: 1,
            user: { name: 'Sarah Chen', avatar: null, initial: 'S' },
            action: 'completed a trip',
            target: 'Mount Washington Winter Ascent',
            time: '2 hours ago',
            type: 'completed',
            stats: { distance: '12km', elevation: '1400m' }
        },
        {
            id: 2,
            user: { name: 'Mike Ross', avatar: null, initial: 'M' },
            action: 'is planning',
            target: 'Algonquin Park Canoe Trip',
            time: '5 hours ago',
            type: 'planning',
            description: 'Looking for 2 more people to join for a 3-day loop.'
        },
        {
            id: 3,
            user: { name: 'Jessica Pearson', avatar: null, initial: 'J' },
            action: 'added new gear',
            target: 'Hyperlite Mountain Gear 3400',
            time: '1 day ago',
            type: 'gear'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Friends' Activity</h1>
                <p className="text-neutral-500">See what your hiking buddies are up to.</p>
            </div>

            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold dark:bg-emerald-900/30 dark:text-emerald-500">
                            {activity.user.initial}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="text-sm">
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{activity.user.name}</span>
                                <span className="text-neutral-500"> {activity.action} </span>
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{activity.target}</span>
                            </div>
                            <div className="text-xs text-neutral-400">{activity.time}</div>

                            {activity.stats && (
                                <div className="mt-2 flex gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /></svg>
                                        {activity.stats.elevation}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                        {activity.stats.distance}
                                    </span>
                                </div>
                            )}

                            {activity.description && (
                                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 italic">
                                    "{activity.description}"
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
