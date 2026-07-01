import { getTripWeather } from '@/lib/services/weather'
import { getApiUser } from '@/lib/supabase/api'
import { badRequest, unauthorized } from '@/lib/api/respond'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const auth = await getApiUser(request)
    if (!auth) return unauthorized()

    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate') ?? undefined

    if (!location || !startDate) {
        return badRequest('location and startDate are required')
    }

    // Same shape the web WeatherWidget consumes: { tempMax, ... } or { error }
    const weather = await getTripWeather(location, startDate, endDate)
    return NextResponse.json(weather)
}
