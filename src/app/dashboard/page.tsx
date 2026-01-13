import { createClient } from '@/lib/supabase/server'
import { getFriendTrips } from '@/app/actions/trips'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: friendTrips } = await getFriendTrips(user.id)

    // Quick Stats
    const tripCount = await prisma.trip.count({
        where: { participants: { some: { userId: user.id } } }
    })

    const gearCount = await prisma.gearItem.count({
        where: { userId: user.id }
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-neutral-900 p-8 sm:p-12 text-white shadow-2xl shadow-black/20 min-h-[300px] flex flex-col justify-end group">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/header1.jpg"
                        alt="Background"
                        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl sm:text-5xl font-black font-heading mb-4 tracking-tight drop-shadow-sm">Welcome back to Basecamp.</h1>
                    <p className="text-neutral-200 text-lg font-medium drop-shadow-sm mb-8 leading-relaxed">
                        Your gear is packed, your routes are planned. Check out what your friends are up to or start planning your next adventure.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link href="/dashboard/trips" className="rounded-full bg-white text-neutral-900 px-6 py-3.5 font-bold text-sm hover:bg-neutral-100 hover:scale-105 transition-all shadow-lg shadow-black/20">
                            Plan a Trip
                        </Link>
                        <Link href="/dashboard/gear" className="rounded-full bg-white/10 text-white px-6 py-3.5 font-bold text-sm hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-md border border-white/10">
                            Manage Gear
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Feed */}
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold font-heading text-neutral-900 dark:text-neutral-100">Friends' Activity</h2>

                    <div className="space-y-4">
                        {friendTrips && friendTrips.length > 0 ? (
                            friendTrips.map((trip) => (
                                <div key={trip.id} className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 transition-all hover:shadow-lg hover:border-emerald-500/30 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500/30">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800">
                                            {trip.organizer.avatarUrl ? (
                                                <img src={trip.organizer.avatarUrl} alt={trip.organizer.fullName || ''} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-neutral-500 font-bold">
                                                    {(trip.organizer.fullName?.[0] || trip.organizer.username?.[0] || '?').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-neutral-900 dark:text-neutral-100">
                                                <span className="font-bold">{trip.organizer.fullName || trip.organizer.username}</span> is organizing a trip
                                            </p>
                                            <h3 className="mt-1 text-lg font-bold font-heading text-neutral-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                                {trip.name}
                                            </h3>
                                            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-neutral-500">
                                                <span className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-md dark:bg-neutral-800">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                                    {new Date(trip.startDate).toLocaleDateString()}
                                                </span>
                                                {trip.location && (
                                                    <span className="flex items-center gap-1.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                                        {trip.location}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Link href={`/dashboard/trips/${trip.id}`} className="absolute inset-0">
                                            <span className="sr-only">View Trip</span>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-neutral-200 p-8 text-center dark:border-neutral-800">
                                <p className="text-neutral-500">No recent activity from friends.</p>
                                <Link href="/dashboard/social" className="mt-2 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-500">
                                    Find friends to follow &rarr;
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats & Quick Links */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold font-heading text-neutral-900 dark:text-neutral-100">Quick Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{tripCount}</div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-500/80">Trips</div>
                        </div>
                        <div className="rounded-2xl bg-teal-50 p-4 border border-teal-100 dark:bg-teal-900/10 dark:border-teal-900/30">
                            <div className="text-3xl font-bold text-teal-700 dark:text-teal-400">{gearCount}</div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-teal-600/80 dark:text-teal-500/80">Gear Items</div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    )
}
