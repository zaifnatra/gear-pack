
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🔄 Resetting all AI threads...')

    try {
        const result = await prisma.user.updateMany({
            data: {
                backboardThreadId: null
            }
        })

        console.log(`✅ Successfully cleared threads for ${result.count} users.`)
        console.log('Next time they chat, a new thread (with the latest Brain) will be created.')
    } catch (error) {
        console.error('❌ Failed to reset threads:', error)
    } finally {
        await prisma.$disconnect()
        // Important: Close the pool to allow the script to exit
        await pool.end()
    }
}

main()
