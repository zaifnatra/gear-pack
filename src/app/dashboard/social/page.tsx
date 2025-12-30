import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getFriends, getPendingRequests, getSentRequests } from '@/app/actions/social'
import { SocialDashboardView } from '@/components/social/SocialDashboardView'

export default async function SocialPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: friends } = await getFriends(user.id)
    const { data: requests } = await getPendingRequests(user.id)
    const { data: sentRequests } = await getSentRequests(user.id)

    return (
        <SocialDashboardView
            userId={user.id}
            friends={friends || []}
            requests={requests || []}
            sentRequests={sentRequests || []}
        />
    )
}
