import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/social/ChatInterface'

export default async function MessagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="h-full">
            <h1 className="mb-6 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Direct Messages</h1>
            <ChatInterface currentUserId={user.id} />
        </div>
    )
}
