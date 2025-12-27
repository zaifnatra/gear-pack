import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
// @ts-ignore
import pg from 'pg'

const connectionString = `${process.env.DATABASE_URL}`
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding dev data...')

    // 1. Create a Test User
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'huzai_dev',
            fullName: 'Huzaifa Dev',
            bio: 'Ultralight backpacking enthusiast.',
        },
    })
    console.log(`👤 User created: ${user.username}`)

    // 2. Get Categories (assuming they exist from previous seed)
    const shelterCat = await prisma.category.findFirst({ where: { name: 'Tent' } })
    const packCat = await prisma.category.findFirst({ where: { name: 'Backpack' } })

    if (!shelterCat || !packCat) {
        console.warn('⚠️ Categories not found. Run "npx prisma db seed" first?')
    }

    // 3. Create Gear Items
    const gearItems = [
        {
            name: 'Hyperlite Mountain Gear 3400 Junction',
            brand: 'Hyperlite Mountain Gear',
            weightGrams: 900,
            condition: 'GOOD',
            categoryId: packCat?.id,
            imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=3000'
        },
        {
            name: 'Zpacks Duplex',
            brand: 'Zpacks',
            weightGrams: 550,
            condition: 'EXCELLENT',
            categoryId: shelterCat?.id,
            imageUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=3000'
        },
        {
            name: 'Enlightened Equipment Revelation 20°',
            brand: 'Enlightened Equipment',
            weightGrams: 600,
            condition: 'NEW',
            // No category for this example to test uncategorized
            imageUrl: 'https://images.unsplash.com/photo-1627662055627-2e8612f00d86?auto=format&fit=crop&q=80&w=3000'
        }
    ]

    for (const item of gearItems) {
        if (item.categoryId) {
            await prisma.gearItem.create({
                data: {
                    name: item.name,
                    brand: item.brand,
                    weightGrams: item.weightGrams,
                    condition: item.condition as any,
                    userId: user.id,
                    categoryId: item.categoryId
                }
            })
        } else {
            // Find a fallback category or skip
            const misc = await prisma.category.findFirst({ where: { name: 'Tools & Misc' } })
            await prisma.gearItem.create({
                data: {
                    name: item.name,
                    brand: item.brand,
                    weightGrams: item.weightGrams,
                    condition: item.condition as any,
                    userId: user.id,
                    categoryId: misc!.id
                }
            })
        }
    }

    console.log(`🎒 Added ${gearItems.length} gear items.`)
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
