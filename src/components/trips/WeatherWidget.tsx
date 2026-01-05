'use client'

import { useState, useEffect } from 'react'

interface WeatherWidgetProps {
    latitude?: number
    longitude?: number
    startDate: Date
    endDate?: Date
}

interface DailyForecast {
    date: string
    maxTemp: number
    minTemp: number
    precipitationProb: number
    weatherCode: number
}

// WMO Weather interpretation codes (WW)
function getWeatherLabel(code: number) {
    if (code === 0) return 'Clear Sky'
    if (code >= 1 && code <= 3) return 'Partly Cloudy'
    if (code >= 45 && code <= 48) return 'Fog'
    if (code >= 51 && code <= 55) return 'Drizzle'
    if (code >= 61 && code <= 65) return 'Rain'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 80 && code <= 82) return 'Showers'
    if (code >= 95) return 'Thunderstorm'
    return 'Unknown'
}

function getWeatherIcon(code: number) {
    if (code === 0) return '☀️'
    if (code <= 3) return '⛅'
    if (code <= 48) return '🌫️'
    if (code <= 65) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 99) return '⛈️'
    return '🌡️'
}

export function WeatherWidget({ latitude, longitude, startDate, endDate }: WeatherWidgetProps) {
    const [forecast, setForecast] = useState<DailyForecast[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!latitude || !longitude) {
            setLoading(false)
            return
        }

        const fetchWeather = async () => {
            try {
                // Open-Meteo works well for 7-14 days forecast. 
                // Creating start/end dates for API query
                const startStr = startDate.toISOString().split('T')[0]
                const endStr = (endDate || startDate).toISOString().split('T')[0]

                // Check if dates are too far in past or future (Open-Meteo free tier limits)
                // Free tier: 90 days past, 14 days future usually.
                // We'll just try to fetch.

                const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${startStr}&end_date=${endStr}`

                const res = await fetch(url)
                if (!res.ok) throw new Error('Weather data unavailable')

                const data = await res.json()

                if (data.daily) {
                    const days = data.daily.time.map((time: string, i: number) => ({
                        date: time,
                        maxTemp: data.daily.temperature_2m_max[i],
                        minTemp: data.daily.temperature_2m_min[i],
                        precipitationProb: data.daily.precipitation_probability_max[i],
                        weatherCode: data.daily.weather_code[i]
                    }))
                    setForecast(days)
                }
            } catch (err) {
                console.error(err)
                setError("Forecast unavailable for these dates.")
            } finally {
                setLoading(false)
            }
        }

        fetchWeather()
    }, [latitude, longitude, startDate, endDate])

    if (!latitude || !longitude) return null

    // Helper: Check if date is "soon" (within 10 days)
    const isSoon = new Date().getTime() - startDate.getTime() > -10 * 24 * 60 * 60 * 1000

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>Weather Forecast</span>
                <span className="text-xs font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                    {latitude.toFixed(2)}, {longitude.toFixed(2)}
                </span>
            </h2>

            {loading && <div className="text-sm text-neutral-500 animate-pulse">Loading forecast...</div>}

            {!loading && error && (
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm text-neutral-500 text-center">
                    {new Date() < startDate ?
                        `Too early for a precise forecast. Check back closer to ${startDate.toLocaleDateString()}.` :
                        "Weather data could not be loaded."
                    }
                </div>
            )}

            {!loading && !error && forecast.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto pb-2">
                    {forecast.map((day) => (
                        <div key={day.date} className="flex flex-col items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30 min-w-[120px]">
                            <span className="text-xs font-medium text-neutral-500 uppercase mb-1">
                                {new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-2xl mb-1">{getWeatherIcon(day.weatherCode)}</span>
                            <span className="text-sm font-semibold">{Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°</span>
                            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 20a4.8 4.5 0 0 1-9.6 0" /></svg>
                                {day.precipitationProb}% Rain
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
