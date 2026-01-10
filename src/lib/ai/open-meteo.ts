export type ForecastMode = "hourly" | "daily"

export interface GeocodeResult {
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
    timezone?: string
}

export interface WeatherForecastResult {
    mode: ForecastMode
    latitude: number
    longitude: number
    timezone: string
    units?: Record<string, string>
    hourly?: unknown
    daily?: unknown
    summary?: {
        headline: string
        notes?: string[]
        riskFlags?: string[]
    }
    source: "open-meteo"
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value)
}

function clampLatLon(latitude: number, longitude: number) {
    const lat = Math.max(-90, Math.min(90, latitude))
    const lon = Math.max(-180, Math.min(180, longitude))
    return { latitude: lat, longitude: lon }
}

function toIsoDate(date: Date) {
    // Open-Meteo accepts YYYY-MM-DD
    return date.toISOString().slice(0, 10)
}

function normalizeDateInput(value: string) {
    // Accept ISO date or ISO datetime; return YYYY-MM-DD.
    const trimmed = value.trim()
    if (!trimmed) throw new Error("Missing date")

    // If already looks like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    const asDate = new Date(trimmed)
    if (Number.isNaN(asDate.getTime())) throw new Error(`Invalid date: ${value}`)
    return toIsoDate(asDate)
}

export async function geocodeLocationName(name: string, limit = 5): Promise<GeocodeResult[]> {
    const trimmed = name.trim()
    if (!trimmed) return []

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", trimmed)
    url.searchParams.set("count", String(Math.max(1, Math.min(10, limit))))
    url.searchParams.set("language", "en")
    url.searchParams.set("format", "json")

    const res = await fetch(url.toString(), { method: "GET" })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Open-Meteo geocoding failed (${res.status}): ${text}`)
    }

    const data = await res.json()
    const results = Array.isArray(data?.results) ? data.results : []
    return results
        .filter((r: any) => isFiniteNumber(r.latitude) && isFiniteNumber(r.longitude) && typeof r.name === "string")
        .map((r: any) => ({
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            country: typeof r.country === "string" ? r.country : undefined,
            admin1: typeof r.admin1 === "string" ? r.admin1 : undefined,
            timezone: typeof r.timezone === "string" ? r.timezone : undefined,
        }))
}

export async function fetchWeatherForecast(params: {
    latitude: number
    longitude: number
    startDate: string
    endDate: string
    mode: ForecastMode
}): Promise<WeatherForecastResult> {
    if (!isFiniteNumber(params.latitude) || !isFiniteNumber(params.longitude)) {
        throw new Error("Invalid latitude/longitude")
    }

    const { latitude, longitude } = clampLatLon(params.latitude, params.longitude)
    const startDate = normalizeDateInput(params.startDate)
    const endDate = normalizeDateInput(params.endDate)

    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", String(latitude))
    url.searchParams.set("longitude", String(longitude))
    url.searchParams.set("timezone", "auto")
    url.searchParams.set("start_date", startDate)
    url.searchParams.set("end_date", endDate)

    if (params.mode === "hourly") {
        url.searchParams.set(
            "hourly",
            [
                "temperature_2m",
                "apparent_temperature",
                "precipitation",
                "precipitation_probability",
                "rain",
                "showers",
                "snowfall",
                "wind_speed_10m",
                "wind_gusts_10m",
                "cloud_cover",
                "weather_code",
            ].join(",")
        )
    } else {
        url.searchParams.set(
            "daily",
            [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "apparent_temperature_max",
                "apparent_temperature_min",
                "precipitation_sum",
                "rain_sum",
                "snowfall_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "sunrise",
                "sunset",
            ].join(",")
        )
    }

    const res = await fetch(url.toString(), { method: "GET" })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Open-Meteo forecast failed (${res.status}): ${text}`)
    }

    const data = await res.json()
    const timezone = typeof data?.timezone === "string" ? data.timezone : "auto"

    const units: Record<string, string> = {}
    if (data?.hourly_units && typeof data.hourly_units === "object") Object.assign(units, data.hourly_units)
    if (data?.daily_units && typeof data.daily_units === "object") Object.assign(units, data.daily_units)

    const result: WeatherForecastResult = {
        mode: params.mode,
        latitude,
        longitude,
        timezone,
        units,
        source: "open-meteo",
    }

    if (params.mode === "hourly") result.hourly = data?.hourly
    else result.daily = data?.daily

    // Minimal safety-focused summary for the assistant (still keep raw fields above).
    const riskFlags: string[] = []
    const notes: string[] = []

    if (params.mode === "daily" && data?.daily) {
        const maxWind = Array.isArray(data.daily.wind_speed_10m_max) ? Math.max(...data.daily.wind_speed_10m_max) : null
        const maxGust = Array.isArray(data.daily.wind_gusts_10m_max) ? Math.max(...data.daily.wind_gusts_10m_max) : null
        const precipMax = Array.isArray(data.daily.precipitation_probability_max)
            ? Math.max(...data.daily.precipitation_probability_max)
            : null

        if (isFiniteNumber(maxWind) && maxWind >= 35) riskFlags.push("high_wind")
        if (isFiniteNumber(maxGust) && maxGust >= 50) riskFlags.push("high_gusts")
        if (isFiniteNumber(precipMax) && precipMax >= 60) riskFlags.push("high_precip_probability")
    }

    if (params.mode === "hourly" && data?.hourly) {
        const precipProb = Array.isArray(data.hourly.precipitation_probability)
            ? Math.max(...data.hourly.precipitation_probability)
            : null
        const wind = Array.isArray(data.hourly.wind_speed_10m) ? Math.max(...data.hourly.wind_speed_10m) : null
        const gust = Array.isArray(data.hourly.wind_gusts_10m) ? Math.max(...data.hourly.wind_gusts_10m) : null
        if (isFiniteNumber(precipProb) && precipProb >= 60) riskFlags.push("high_precip_probability")
        if (isFiniteNumber(wind) && wind >= 35) riskFlags.push("high_wind")
        if (isFiniteNumber(gust) && gust >= 50) riskFlags.push("high_gusts")
    }

    if (riskFlags.includes("high_precip_probability")) notes.push("High chance of precipitation—plan rain protection and traction if needed.")
    if (riskFlags.includes("high_wind") || riskFlags.includes("high_gusts")) notes.push("Strong winds/gusts—avoid exposed ridges and pack wind layers.")

    result.summary = {
        headline: `Forecast loaded (${params.mode}) for ${startDate} → ${endDate}.`,
        notes: notes.length ? notes : undefined,
        riskFlags: riskFlags.length ? Array.from(new Set(riskFlags)) : undefined,
    }

    return result
}

