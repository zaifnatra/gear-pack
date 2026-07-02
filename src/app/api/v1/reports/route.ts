import { createReport } from '@/lib/services/moderation'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { ReportTargetType } from '@prisma/client'
import { z } from 'zod'

const ReportSchema = z.object({
    targetType: z.enum(ReportTargetType),
    targetId: z.string().min(1),
    reason: z.string().min(1).max(500),
})

export async function POST(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const parsed = await parseBody(request, ReportSchema)
    if (parsed.response) return parsed.response

    return respond(await createReport(auth.user.id, parsed.data))
}
