import { getTrips, getTripInvites } from '@/app/actions/trips'
import { TripDashboardView } from '@/components/trips/TripDashboardView'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TripsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch trips and invites server-side
    const { data: trips } = await getTrips(user.id)
    const { data: invites } = await getTripInvites(user.id)

    return (
        <div className="h-full">
            <TripDashboardView
                initialTrips={trips || []}
                invites={invites || []}
                userId={user.id}
            />
        </div>
    )
}
