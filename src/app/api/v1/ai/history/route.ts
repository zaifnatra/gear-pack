import { getChatHistory } from '@/lib/services/aiChat'
import { getApiUser } from '@/lib/supabase/api'
import { unauthorized } from '@/lib/api/respond'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    try {
        const history = await getChatHistory(auth.user.id)
        return NextResponse.json({ success: true, data: history })
    } catch (error) {
        console.error('Failed to fetch chat history:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch chat history' }, { status: 502 })
    }
}
