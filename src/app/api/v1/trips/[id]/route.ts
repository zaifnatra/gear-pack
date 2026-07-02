import { deleteTrip, getTrip } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { notFound, respond, unauthorized } from '@/lib/api/respond'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    const result = await getTrip(id)

    if (!result?.success || !result.trip) return notFound('Trip not found')

    return respond(result)
}

export async function DELETE(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await deleteTrip(id, auth.user.id))
}
