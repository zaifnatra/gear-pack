import { isTripGearAccessible, removeGearFromTrip, togglePacked } from '@/lib/services/tripGear'
import { getApiUser } from '@/lib/supabase/api'
import { forbidden, parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

type Params = { params: Promise<{ id: string }> }

const PackedSchema = z.object({
    isPacked: z.boolean(),
})

export async function PATCH(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isTripGearAccessible(id, auth.user.id)) {
        return forbidden('Only trip participants can modify the gear list')
    }

    const parsed = await parseBody(request, PackedSchema)
    if (parsed.response) return parsed.response

    return respond(await togglePacked(id, parsed.data.isPacked))
}

export async function DELETE(request: Request, { params }: Params) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { id } = await params
    if (!await isTripGearAccessible(id, auth.user.id)) {
        return forbidden('Only trip participants can modify the gear list')
    }

    const result = await removeGearFromTrip(id)
    return respond({ success: result.success, ...(result.error ? { error: result.error } : {}) })
}
