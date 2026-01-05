import { getTrip } from '@/app/actions/trips'
import { notFound } from 'next/navigation'
import { TripActions } from '@/components/trips/TripActions'
import { getTripGear } from '@/app/actions/tripGear'
import { TripGearList } from '@/components/trips/TripGearList'
import { RecommendedGear } from '@/components/trips/RecommendedGear'
import { WeatherWidget } from '@/components/trips/WeatherWidget'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function TripDetailsPage({ params }: PageProps) {
    const { id } = await params
    const result = await getTrip(id)

    if (!result || !result.success || !result.trip) {
        notFound()
    }
    const trip = result.trip as any
    const gearRes = await getTripGear(id)
    const gearList = gearRes.success && gearRes.data ? gearRes.data : []

    // Verify auth
    const cookieStore = await cookies()

    // Create Supabase SSR client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }
    const currentUserId = user.id

    const startDate = new Date(trip.startDate)
    const endDate = trip.endDate ? new Date(trip.endDate) : null
    const dateRange = endDate
        ? `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
        : startDate.toLocaleDateString(undefined, { dateStyle: 'medium' })

    const days = endDate
        ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-neutral-900">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black/60 z-10"></div>
                {/* Fallback pattern or image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50 block"></div>

                <div className="absolute bottom-6 left-6 z-20 text-white">
                    <div className="flex gap-2 mb-2">
                        <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-1 text-xs font-medium backdrop-blur-md">
                            {trip.type.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium backdrop-blur-md ${trip.difficulty === 'EASY' ? 'bg-green-500/30' :
                            trip.difficulty === 'MODERATE' ? 'bg-yellow-500/30' :
                                'bg-red-500/30'
                            }`}>
                            {trip.difficulty}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold">{trip.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-200">
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            {trip.location || 'Unknown Location'}
                        </span>
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            {dateRange} ({days} days)
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="text-center">
                            <div className="text-xs uppercase text-neutral-500 font-semibold mb-1">Distance</div>
                            <div className="text-xl font-bold">
                                {trip.distance ? `${trip.distance} km` : <span className="text-neutral-300 dark:text-neutral-700">—</span>}
                            </div>
                        </div>
                        <div className="text-center border-l border-neutral-200 dark:border-neutral-800">
                            <div className="text-xs uppercase text-neutral-500 font-semibold mb-1">Elevation</div>
                            <div className="text-xl font-bold">
                                {trip.elevationGain ? `${trip.elevationGain} m` : <span className="text-neutral-300 dark:text-neutral-700">—</span>}
                            </div>
                        </div>
                        <div className="text-center border-l border-neutral-200 dark:border-neutral-800">
                            <div className="text-xs uppercase text-neutral-500 font-semibold mb-1">Participants</div>
                            <div className="text-xl font-bold">{trip.participants.length}</div>
                        </div>
                    </div>

                    {/* Gear List Section (Group Gear) */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Group Gear</h2>
                        </div>
                        <TripGearList
                            tripId={id}
                            currentUserId={currentUserId}
                            gearList={gearList}
                        />
                    </div>

                    {/* Recommendations (Personal) */}
                    <RecommendedGear
                        tripId={id}
                        userId={currentUserId}
                        tripType={trip.type}
                        startDate={startDate}
                        days={days}
                    />

                    {/* Weather Forecast */}
                    <WeatherWidget
                        latitude={trip.latitude}
                        longitude={trip.longitude}
                        startDate={startDate}
                        endDate={endDate || undefined}
                    />

                    {/* About */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <h2 className="text-lg font-semibold mb-4">About this Trip</h2>
                        <p className="text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                            {trip.description || 'No description provided.'}
                        </p>
                        {trip.externalUrl && (
                            <div className="mt-4">
                                <a
                                    href={trip.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    View Route on AllTrails
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Actions */}
                    <TripActions
                        tripId={trip.id}
                        currentUserId={currentUserId}
                        organizerId={trip.organizerId}
                    />

                    {/* Participants */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                        <h3 className="text-sm font-semibold uppercase text-neutral-500 mb-4">Who's Going</h3>
                        <div className="space-y-3">
                            {trip.participants.map((p: { user: { id: string; fullName: string | null; avatarUrl: string | null; username: string | null } }) => (
                                <div key={p.user.id} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {p.user.avatarUrl ? <img src={p.user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : p.user.fullName?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.user.fullName}</div>
                                        <div className="text-xs text-neutral-500">@{p.user.username}</div>
                                    </div>
                                    {trip.organizerId === p.user.id && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                                            HOST
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
