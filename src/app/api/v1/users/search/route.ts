import { searchUsers } from '@/lib/services/social'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') ?? ''

    return respond(await searchUsers(query, auth.user.id))
}
