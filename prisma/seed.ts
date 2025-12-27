// prisma/seed.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('filling db')

  // 1. CLEAR EXISTING DATA (Optional: Keeps it clean)
  // await prisma.category.deleteMany()

  // 2. DEFINE CATEGORIES
  const categories = [
    {
      name: 'Shelter & Sleep',
      children: ['Tent', 'Hammock', 'Bivy', 'Sleeping Bag', 'Quilt', 'Sleeping Pad', 'Pillow']
    },
    {
      name: 'Pack & Bags',
      children: ['Backpack', 'Daypack', 'Dry Bag', 'Stuff Sack', 'Fanny Pack']
    },
    {
      name: 'Kitchen',
      children: ['Stove', 'Fuel', 'Pot/Pan', 'Utensil', 'Mug/Cup', 'Water Filter', 'Water Bottle']
    },
    {
      name: 'Clothing (Worn)',
      children: ['Base Layer', 'Hiking Pants', 'Shorts', 'T-Shirt', 'Sun Hoody', 'Hat', 'Sunglasses']
    },
    {
      name: 'Clothing (Packed)',
      children: ['Rain Jacket', 'Puffy/Insulation', 'Fleece', 'Wind Shirt', 'Gloves', 'Beanie', 'Camp Shoes']
    },
    {
      name: 'Electronics',
      children: ['Headlamp', 'Power Bank', 'Cables', 'Phone', 'Camera', 'Satellite Messenger']
    },
    {
      name: 'Hygiene & First Aid',
      children: ['First Aid Kit', 'Toothbrush', 'Trowel', 'Toilet Paper', 'Sunscreen', 'Bug Spray', 'Soap']
    },
    {
      name: 'Tools & Misc',
      children: ['Trekking Poles', 'Knife/Multi-tool', 'Repair Kit', 'Lighter', 'Bear Canister']
    }
  ]

  // 3. INSERT INTO DATABASE
  for (const cat of categories) {
    const parent = await prisma.category.create({
      data: { name: cat.name }
    })

    console.log(`Created Parent: ${cat.name}`)

    for (const childName of cat.children) {
      await prisma.category.create({
        data: {
          name: childName,
          parentId: parent.id
        }
      })
    }
  }

  console.log('finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })