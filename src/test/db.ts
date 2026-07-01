import { prisma } from '@/lib/prisma'

export async function cleanDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Reaction",
      "Message",
      "ConversationParticipant",
      "Conversation",
      "Notification",
      "TripGear",
      "Participant",
      "Trip",
      "Friendship",
      "Waitlist",
      "GearItem",
      "Category",
      "User"
    RESTART IDENTITY CASCADE
  `)
}

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const uid = Date.now() + Math.random()
  return prisma.user.create({
    data: {
      email: `test-${uid}@example.com`,
      username: `testuser-${uid}`,
      ...overrides,
    },
  })
}

export async function createTestCategory(name = 'Shelter') {
  return prisma.category.create({ data: { name } })
}
