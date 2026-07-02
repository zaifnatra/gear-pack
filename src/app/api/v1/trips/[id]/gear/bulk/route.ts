import { addMultipleGearToTrip } from '@/lib/services/tripGear'
import { isTripParticipant } from '@/lib/services/trips'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const BulkAddSchema = z.object({
    gearIds: z.array(z.string().min(1)).min(1).max(100),
    isShared: z.boolean().optional(),
})

export async function POST(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isTripParticipant(id, auth.user.id)) {
        return forbidden('Only trip participants can modify the gear list')
    }

    const parsed = await parseBody(request, BulkAddSchema)
    if (parsed.response) return parsed.response

    return respond(await addMultipleGearToTrip(id, parsed.data.gearIds, auth.user.id, parsed.data.isShared ?? false))
}
