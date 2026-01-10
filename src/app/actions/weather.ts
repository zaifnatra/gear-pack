'use server'

import { fetchWeatherForecast, geocodeLocationName } from '@/lib/ai/open-meteo'

export interface TripWeather {
    tempMax?: number
    tempMin?: number
    precipProb?: number
    condition?: string
    summary?: string
    error?: string
}

export async function getTripWeather(location: string, startDate: string, endDate?: string): Promise<TripWeather> {
    try {
        if (!location) return { error: "No location provided" }

        // 1. Geocode
        const candidates = await geocodeLocationName(location, 1)
        if (!candidates || candidates.length === 0) {
            return { error: "Location not found" }
        }
        const { latitude, longitude } = candidates[0]

        // 2. Determine mode (daily vs hourly? daily is lighter)
        // User asked for "1 day or multi day weather". Daily is usually best for "Trip Overview".
        // Start/End are likely ISO strings or YYYY-MM-DD.
        // If we only have startDate, assume 1 day.

        let startIso = startDate
        let endIso = endDate || startDate

        // Basic date cleanup if needed (open-meteo.ts handles it too)
        if (startIso.includes('T')) startIso = startIso.split('T')[0]
        if (endIso.includes('T')) endIso = endIso.split('T')[0]

        // Fetch
        const forecast = await fetchWeatherForecast({
            latitude,
            longitude,
            startDate: startIso,
            endDate: endIso,
            mode: 'daily'
        })

        if (!forecast.daily) {
            return { error: "No forecast data available" }
        }

        const daily = forecast.daily as any

        // Aggregate or pick first day?
        // Let's return average/max for the whole trip or specific ranges.
        // For a simple card, maybe just the *first day* or *range*.
        // The user said "provide weather data".

        // Let's return the range of temps and max precip.
        const maxTemps = daily.temperature_2m_max as number[]
        const minTemps = daily.temperature_2m_min as number[]
        const precipProbs = daily.precipitation_probability_max as number[]
        const codes = daily.weather_code as number[]

        const tempMax = Math.max(...maxTemps)
        const tempMin = Math.min(...minTemps)
        const precipProb = Math.max(...precipProbs)
        // Most common code? Or worst? Let's take the code of the day with worst weather? Or just first day.
        const conditionCode = codes[0]

        // Map WMO code to string
        const condition = decodeWeatherCode(conditionCode)

        return {
            tempMax,
            tempMin,
            precipProb,
            condition,
            summary: forecast.summary?.headline
        }

    } catch (e: any) {
        console.error("Weather Fetch Error:", e)
        return { error: "Failed to load weather" }
    }
}

function decodeWeatherCode(code: number): string {
    // Simple WMO code mapping
    if (code === 0) return "Clear sky"
    if (code === 1) return "Mainly clear"
    if (code === 2) return "Partly cloudy"
    if (code === 3) return "Overcast"
    if (code >= 45 && code <= 48) return "Fog"
    if (code >= 51 && code <= 55) return "Drizzle"
    if (code >= 56 && code <= 57) return "Freezing Drizzle"
    if (code >= 61 && code <= 65) return "Rain"
    if (code >= 66 && code <= 67) return "Freezing Rain"
    if (code >= 71 && code <= 77) return "Snow"
    if (code >= 80 && code <= 82) return "Rain showers"
    if (code >= 85 && code <= 86) return "Snow showers"
    if (code >= 95) return "Thunderstorm"
    if (code >= 96 && code <= 99) return "Thunderstorm with hail"
    return "Unknown"
}
