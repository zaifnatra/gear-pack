import { addGearToTrip, getTripGear } from '@/lib/services/tripGear'
import { isTripParticipant } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const AddGearSchema = z.object({
    gearId: z.string().min(1),
    isShared: z.boolean().optional(),
})

export async function GET(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    return respond(await getTripGear(id))
}

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isTripParticipant(id, auth.user.id)) {
        return forbidden('Only trip participants can modify the gear list')
    }

    const parsed = await parseBody(request, AddGearSchema)
    if (parsed.response) return parsed.response

    return respond(await addGearToTrip(id, parsed.data.gearId, auth.user.id, parsed.data.isShared ?? false))
}
