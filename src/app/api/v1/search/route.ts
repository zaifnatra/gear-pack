import { searchGlobal } from '@/lib/services/search'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') ?? ''

    return respond(await searchGlobal(query, auth.user.id))
}
