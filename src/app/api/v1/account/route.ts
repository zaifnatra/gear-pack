import { deleteAccount } from '@/lib/services/users'
import { getApiUser } from '@/lib/supabase/api'
import { respond, unauthorized } from '@/lib/api/respond'

/**
 * In-app account deletion (App Store guideline 5.1.1(v)): removes all
 * application data and the Supabase auth user.
 */
export async function DELETE(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    return respond(await deleteAccount(auth.user.id))
}
