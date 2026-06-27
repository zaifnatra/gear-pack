import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  createTrip,
  inviteUserToTrip,
  respondToTripInvite,
  deleteTrip,
  getTrips,
} from '@/app/actions/trips'
import { cleanDatabase, createTestUser } from '@/test/db'

const baseTripData = {
  name: 'PCT Section J',
  startDate: '2026-08-01',
  endDate: '2026-08-05',
  type: 'MULTI_DAY' as const,
  difficulty: 'HARD' as const,
}

describe('trips actions', () => {
  let organizer: Awaited<ReturnType<typeof createTestUser>>
  let friend: Awaited<ReturnType<typeof createTestUser>>
  let stranger: Awaited<ReturnType<typeof createTestUser>>

  beforeEach(async () => {
    await cleanDatabase()
    organizer = await createTestUser()
    friend = await createTestUser()
    stranger = await createTestUser()
  })

  afterAll(async () => {
    await cleanDatabase()
  })

  describe('createTrip', () => {
    it('creates a trip and auto-adds organizer as ACCEPTED ORGANIZER participant', async () => {
      const result = await createTrip(organizer.id, baseTripData)
      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('PCT Section J')

      const participant = await prisma.participant.findUnique({
        where: { userId_tripId: { userId: organizer.id, tripId: result.data!.id } },
      })
      expect(participant?.role).toBe('ORGANIZER')
      expect(participant?.status).toBe('ACCEPTED')
    })

    it('returns success:false when trip type is invalid', async () => {
      const result = await createTrip(organizer.id, {
        ...baseTripData,
        type: 'INVALID_TYPE' as any,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('inviteUserToTrip', () => {
    it('creates an INVITED participant when organizer invites', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const tripId = tripResult.data!.id

      const result = await inviteUserToTrip(tripId, friend.id, organizer.id)
      expect(result.success).toBe(true)

      const participant = await prisma.participant.findUnique({
        where: { userId_tripId: { userId: friend.id, tripId } },
      })
      expect(participant?.status).toBe('INVITED')
    })

    it('blocks a non-member from inviting', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const result = await inviteUserToTrip(tripResult.data!.id, friend.id, stranger.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unauthorized/i)
    })

    it('blocks inviting someone already invited', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const tripId = tripResult.data!.id
      await inviteUserToTrip(tripId, friend.id, organizer.id)

      const result = await inviteUserToTrip(tripId, friend.id, organizer.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/already/i)
    })
  })

  describe('respondToTripInvite', () => {
    it('upgrades participant to ACCEPTED MEMBER on accept', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const tripId = tripResult.data!.id
      await inviteUserToTrip(tripId, friend.id, organizer.id)

      const result = await respondToTripInvite(tripId, friend.id, 'ACCEPTED')
      expect(result.success).toBe(true)

      const participant = await prisma.participant.findUnique({
        where: { userId_tripId: { userId: friend.id, tripId } },
      })
      expect(participant?.status).toBe('ACCEPTED')
      expect(participant?.role).toBe('MEMBER')
    })

    it('removes participant record on DECLINED', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const tripId = tripResult.data!.id
      await inviteUserToTrip(tripId, friend.id, organizer.id)

      await respondToTripInvite(tripId, friend.id, 'DECLINED')

      const participant = await prisma.participant.findUnique({
        where: { userId_tripId: { userId: friend.id, tripId } },
      })
      expect(participant).toBeNull()
    })
  })

  describe('deleteTrip', () => {
    it('allows organizer to delete the trip', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const tripId = tripResult.data!.id

      const result = await deleteTrip(tripId, organizer.id)
      expect(result.success).toBe(true)

      const check = await prisma.trip.findUnique({ where: { id: tripId } })
      expect(check).toBeNull()
    })

    it('blocks non-organizer from deleting', async () => {
      const tripResult = await createTrip(organizer.id, baseTripData)
      const result = await deleteTrip(tripResult.data!.id, stranger.id)
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unauthorized/i)
    })
  })
})
