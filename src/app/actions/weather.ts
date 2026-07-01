'use server'

import * as weatherService from '@/lib/services/weather'

export type TripWeather = weatherService.TripWeather

export async function getTripWeather(location: string, startDate: string, endDate?: string): Promise<TripWeather> {
    return weatherService.getTripWeather(location, startDate, endDate)
}
