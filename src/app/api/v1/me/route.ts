import { getMe, updateProfile } from '@/lib/services/users'
import { getApiUser } from '@/lib/supabase/api'
import { parseBody, respond, unauthorized } from '@/lib/api/respond'
import { z } from 'zod'

// Mirrors the web ProfileSchema (src/app/dashboard/profile/actions.ts)
const ProfileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(50).optional().or(z.literal('')),
    bio: z.string().max(300, 'Bio must be less than 300 characters').optional().or(z.literal('')),
    avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    location: z.string().max(100, 'Location must be less than 100 characters').optional().or(z.literal('')),
})

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await getMe(auth.user.id))
}

export async function PATCH(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const parsed = await parseBody(request, ProfileSchema)
    if (parsed.response) return parsed.response

    return respond(await updateProfile(auth.user.id, parsed.data))
}
