import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

/**
 * Response helpers for /api/v1 route handlers.
 *
 * Services return the same `{ success, data | error }` contract the server
 * actions use; `respond` maps that contract onto HTTP status codes so the
 * mobile client can rely on statuses while payload shapes stay identical
 * to the web.
 */

type ServiceResult = { success: boolean; error?: string } & Record<string, unknown>

export function unauthorized() {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(error = 'Forbidden') {
    return NextResponse.json({ success: false, error }, { status: 403 })
}

export function notFound(error = 'Not found') {
    return NextResponse.json({ success: false, error }, { status: 404 })
}

export function badRequest(error: string, details?: string[]) {
    return NextResponse.json({ success: false, error, details }, { status: 400 })
}

export function respond(result: ServiceResult) {
    if (result.success) {
        return NextResponse.json(result)
    }

    const error = result.error ?? 'Request failed'
    const lower = error.toLowerCase()
    let status = 400
    if (lower.includes('unauthorized')) status = 403
    else if (lower.includes('not found')) status = 404
    else if (lower.includes('too many') || lower.includes('too quickly')) status = 429
    else if (lower.includes('already taken') || lower.includes('already registered') || lower.includes('already exists')) status = 409

    return NextResponse.json(result, { status })
}

export function getClientIp(request: Request): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export function tooManyRequests(error = 'Too many requests. Please try again later.') {
    return NextResponse.json({ success: false, error }, { status: 429 })
}

export async function parseBody<T>(
    request: Request,
    schema: ZodType<T>
): Promise<{ data: T; response?: never } | { data?: never; response: NextResponse }> {
    let json: unknown
    try {
        json = await request.json()
    } catch {
        return { response: badRequest('Invalid JSON body') }
    }

    const parsed = schema.safeParse(json)
    if (!parsed.success) {
        const details = parsed.error.issues.map(
            (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`
        )
        return { response: badRequest('Invalid request', details) }
    }

    return { data: parsed.data }
}
