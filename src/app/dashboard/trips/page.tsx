import { getTrips } from '@/app/actions/trips'
import { TripDashboardView } from '@/components/trips/TripDashboardView'

export default async function TripsPage() {
    // In a real app, we would get the session user ID here
    // For this demo, we assume the seeded user
    const userId = "user-123"

    // Fetch trips server-side
    const { data: trips } = await getTrips(userId)

    return (
        <div className="h-full">
            <TripDashboardView initialTrips={trips || []} userId={userId} />
        </div>
    )
}
