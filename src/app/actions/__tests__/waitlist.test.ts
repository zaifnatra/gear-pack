import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { joinWaitlist } from '@/app/actions/waitlist'
import { cleanDatabase } from '@/test/db'

const initialState = {
  success: false,
  message: '',
  count: 0,
}

function waitlistForm(email: string) {
  const formData = new FormData()
  formData.set('email', email)
  return formData
}

describe('waitlist actions', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  it('normalizes email before joining the waitlist', async () => {
    const result = await joinWaitlist(initialState, waitlistForm('  Person@Example.COM  '))

    expect(result).toEqual({
      success: true,
      message: "You're on the waitlist.",
      count: 1,
    })

    const entries = await prisma.waitlist.findMany()
    expect(entries).toHaveLength(1)
    expect(entries[0].email).toBe('person@example.com')
  })

  it('does not create another entry for the same normalized email', async () => {
    await joinWaitlist(initialState, waitlistForm('person@example.com'))

    const duplicateResult = await joinWaitlist(initialState, waitlistForm('  PERSON@example.com  '))

    expect(duplicateResult).toEqual({
      success: true,
      message: "You're already on the waitlist.",
      count: 1,
    })

    const entries = await prisma.waitlist.findMany({ where: { email: 'person@example.com' } })
    expect(entries).toHaveLength(1)
  })
})
