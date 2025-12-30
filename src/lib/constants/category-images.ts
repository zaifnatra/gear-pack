// Local images in public/categories/
// Mapped to the specific filenames user provided
export const CATEGORY_IMAGES: Record<string, string> = {
    // Shelter & Sleep
    'Tent': '/categories/tent.webp',
    'Hammock': '/categories/hammock.webp',
    'Bivy': '/categories/bivy.webp',
    'Sleeping Bag': '/categories/sleepingbag.webp',
    'Quilt': '/categories/sleepingbag.webp', // Fallback
    'Sleeping Pad': '/categories/sleepingbag.webp', // Fallback (no specific pad image found)
    'Pillow': '/categories/pillow.png',

    // Pack & Bags
    'Backpack': '/categories/bagpack.png',
    'Daypack': '/categories/daypack.avif',
    'Dry Bag': '/categories/bagpack.png', // Fallback

    // Kitchen & Water
    'Stove': '/categories/stove.webp',
    'Fuel': '/categories/fuel.webp',
    'Pot': '/categories/pot.webp',
    'Cookware': '/categories/pot.webp',
    'Mug': '/categories/mug.webp',
    'Utensil': '/categories/utensils.webp',
    'Spoon': '/categories/utensils.webp',
    'Water Filter': '/categories/filter.jfif',
    'Water Bottle': '/categories/bottle.webp',

    // Clothing - Tops
    'Rain Jacket': '/categories/rainjacket.webp',
    'Down Jacket': '/categories/down.webp',
    'Puffy': '/categories/down.webp',
    'Fleece': '/categories/fleece.webp',
    'Base Layer': '/categories/baselayer.webp',
    'T-Shirt': '/categories/tshirt.webp',
    'Shirt': '/categories/tshirt.webp',

    // Clothing - Bottoms
    'Pants': '/categories/hikingpants.webp',
    'Shorts': '/categories/shorts.webp',

    // Clothing - Accessories
    'Hat': '/categories/hat.webp',
    'Beanie': '/categories/beanie.webp',
    'Gloves': '/categories/gloves.webp',
    'Camp Shoes': '/categories/campshoes.webp',
    'Boots': '/categories/campshoes.webp', // Fallback

    // Electronics
    'Headlamp': '/categories/headlamp.jfif',
    'Power Bank': '/categories/powerbank.webp',
    'Battery': '/categories/powerbank.webp',
    'Satellite': '/categories/satellite.webp',
    'GPS': '/categories/satellite.webp',

    // Tools & Hygiene
    'Trekking Poles': '/categories/trekking.png',
    'Knife': '/categories/multitool.webp',
    'Multitool': '/categories/multitool.webp',
    'Bear Canister': '/categories/bearcanister.webp',
    'Trowel': '/categories/trowel.webp',
    'First Aid': '/categories/firstaidkit_.jpg',
    'Bug Spray': '/categories/bugspray.webp',
    'Sunscreen': '/categories/sunscreenwebp.webp',
    'Sunglasses': '/categories/sunglasses.avif',
    'Toothbrush': '/categories/toothbrush.avif',
    'Toilet Paper': '/categories/toiletpaper.png',
    'Lighter': '/categories/lighter.jfif',
    'Soap': '/categories/barsoap.webp',

    // Default
    'DEFAULT': '/categories/bagpack.png' // Good generic default
}

export function getCategoryDefaultImage(categoryName: string = ''): string {
    if (!categoryName) return CATEGORY_IMAGES['DEFAULT']

    // 1. Direct match
    if (CATEGORY_IMAGES[categoryName]) {
        return CATEGORY_IMAGES[categoryName]
    }

    // 2. Partial match loop (smarter fallback)
    const lowerName = categoryName.toLowerCase()

    // Specific overrides for partials if needed
    if (lowerName.includes('shoe') || lowerName.includes('boot')) return CATEGORY_IMAGES['Camp Shoes']
    if (lowerName.includes('jacket') || lowerName.includes('shell')) return CATEGORY_IMAGES['Rain Jacket']
    if (lowerName.includes('shirt')) return CATEGORY_IMAGES['T-Shirt']
    if (lowerName.includes('bag')) return CATEGORY_IMAGES['Backpack'] // Generic bag

    for (const key of Object.keys(CATEGORY_IMAGES)) {
        if (lowerName.includes(key.toLowerCase())) {
            return CATEGORY_IMAGES[key]
        }
    }

    // 3. Fallback
    return CATEGORY_IMAGES['DEFAULT']
}
