import { createTrip, getTrips } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { TripSchema } from '@/lib/api/schemas'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await getTrips(auth.user.id))
}

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const parsed = await parseBody(request, TripSchema)
    if (parsed.response) return parsed.response

    return respond(await createTrip(auth.user.id, parsed.data))
}
