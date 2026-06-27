import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all external dependencies before importing the module under test
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            update: vi.fn()
        }
    }
}))

vi.mock('@/lib/backboard', () => ({
    getThreadHistory: vi.fn(),
    createThread: vi.fn(),
    addMessage: vi.fn(),
    getLatestResponse: vi.fn(),
    submitToolOutputs: vi.fn()
}))

vi.mock('@/lib/ai/tools', () => ({
    createTrip: vi.fn(),
    getUserGear: vi.fn(),
    getUserProfile: vi.fn(),
    updateUserPreferences: vi.fn(),
    addGearToTrip: vi.fn(),
    getWeatherForecast: vi.fn()
}))

import { getChatHistory } from '../ai-chat'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getThreadHistory } from '@/lib/backboard'

function makeMockSupabase(userId: string | null) {
    return {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: userId ? { id: userId } : null }
            })
        }
    }
}

describe('getChatHistory', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns empty array when user is not authenticated', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase(null) as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        const result = await getChatHistory()
        expect(result).toEqual([])
    })

    it('returns empty array when user has no Backboard thread', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase('user1') as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ backboardThreadId: null } as never)
        const result = await getChatHistory()
        expect(result).toEqual([])
    })

    it('filters out tool role messages', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase('user1') as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ backboardThreadId: 'thread1' } as never)
        vi.mocked(getThreadHistory).mockResolvedValue([
            { role: 'user', content: 'Hello!' },
            { role: 'tool', content: '{"tool_call_id":"abc"}' },
            { role: 'assistant', content: 'Hi there!' }
        ])
        const result = await getChatHistory()
        expect(result).toHaveLength(2)
        expect(result[0].role).toBe('user')
        expect(result[0].message).toBe('Hello!')
        expect(result[1].role).toBe('assistant')
    })

    it('filters out raw JSON tool output echoed as user role', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase('user1') as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ backboardThreadId: 'thread1' } as never)
        vi.mocked(getThreadHistory).mockResolvedValue([
            { role: 'user', content: '{"success":true,"data":[]}' },
            { role: 'assistant', content: 'Done!' }
        ])
        const result = await getChatHistory()
        expect(result).toHaveLength(1)
        expect(result[0].role).toBe('assistant')
    })

    it('keeps trail_options UI card messages despite being JSON', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase('user1') as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ backboardThreadId: 'thread1' } as never)
        vi.mocked(getThreadHistory).mockResolvedValue([
            { role: 'assistant', content: '{"type": "trail_options","message":"Here are trails"}' }
        ])
        const result = await getChatHistory()
        expect(result).toHaveLength(1)
    })

    it('strips [Current Context: ...] injection from user messages', async () => {
        vi.mocked(createClient).mockResolvedValue(makeMockSupabase('user1') as ReturnType<typeof createClient> extends Promise<infer T> ? T : never)
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ backboardThreadId: 'thread1' } as never)
        vi.mocked(getThreadHistory).mockResolvedValue([
            { role: 'user', content: '[Current Context: Today is Mon Jan 01 2024. User Location: Unknown. User Preferences: {}.] What hikes are near Seattle?' }
        ])
        const result = await getChatHistory()
        expect(result[0].message).toBe('What hikes are near Seattle?')
    })
})
