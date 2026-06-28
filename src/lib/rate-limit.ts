// src/lib/rate-limit.ts
// In-memory rate limiter. Resets on server restart.
// For multi-instance deployments, replace store with Redis.

interface RateLimitEntry {
    count: number
    windowEnd: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(
    key: string,
    maxCount: number,
    windowMs: number
): { allowed: boolean } {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.windowEnd) {
        store.set(key, { count: 1, windowEnd: now + windowMs })
        return { allowed: true }
    }

    if (entry.count >= maxCount) {
        return { allowed: false }
    }

    entry.count++
    return { allowed: true }
}
