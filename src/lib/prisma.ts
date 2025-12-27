import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
// @ts-ignore
import pg from 'pg'

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
