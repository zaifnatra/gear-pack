export interface TrailTemplate {
    name: string
    location: string
    distance: number
    elevationGain: number
    difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME'
    type: 'DAY_HIKE' | 'OVERNIGHT' | 'MULTI_DAY' | 'THRU_HIKE' | 'OTHER'
    description?: string
}

export const POPULAR_TRAILS: TrailTemplate[] = [
    // US - Northeast
    {
        name: "Mount Washington via Tuckerman Ravine",
        location: "Pinkham Notch, NH",
        distance: 7.4, // miles approx
        elevationGain: 1280, // meters approx (4200ft)
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "The classic route up Mount Washington. Steep, rocky, and exposed. Check weather before ascending!"
    },
    {
        name: "Mount Marcy via Van Hoevenberg Trail",
        location: "Adirondacks, NY",
        distance: 14.8, // miles
        elevationGain: 965, // meters (3166ft)
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Highest peak in NY state. Long day hike with rocky terrain."
    },
    {
        name: "Franconia Ridge Loop",
        location: "Lincoln, NH",
        distance: 8.9,
        elevationGain: 1160,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "One of the best ridge walks in the White Mountains. Covers Little Haystack, Lincoln, and Lafayette."
    },

    // Canada - Quebec
    {
        name: "Mont Tremblant via Grand Brûlé",
        location: "Mont-Tremblant, QC",
        distance: 13.5, // km
        elevationGain: 650,
        difficulty: "MODERATE",
        type: "DAY_HIKE",
        description: "Scenic loop accessing the summit of Mont Tremblant."
    },
    {
        name: "Acropole des Draveurs",
        location: "Charlevoix, QC",
        distance: 10.4, // km
        elevationGain: 800,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Iconic trail in Hautes-Gorges-de-la-Rivière-Malbaie National Park with stunning valley views."
    },
    {
        name: "Les Loups",
        location: "Jacques-Cartier NP, QC",
        distance: 11.0,
        elevationGain: 447,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Breathtaking views of the Jacques-Cartier and Sautauriski valleys."
    },
    {
        name: "Le Montérégien",
        location: "Mont-Saint-Bruno NP, QC",
        distance: 8.8,
        elevationGain: 120,
        difficulty: "EASY",
        type: "DAY_HIKE",
        description: "A pleasant loop through the lakes chain, perfect for families."
    },
    {
        name: "Dieppe Trail",
        location: "Mont-Saint-Hilaire, QC",
        distance: 3.8,
        elevationGain: 415,
        difficulty: "MODERATE",
        type: "DAY_HIKE",
        description: "Popular rocky climb to a rocky summit with great views of the region."
    },
    {
        name: "Le Sommet (Summit Circle)",
        location: "Mont-Royal, Montreal, QC",
        distance: 8.5,
        elevationGain: 207,
        difficulty: "EASY",
        type: "DAY_HIKE",
        description: "The classic loop in the heart of Montreal. City views and forest paths."
    },
    {
        name: "Calvaire d'Oka",
        location: "Oka NP, QC",
        distance: 4.4,
        elevationGain: 125,
        difficulty: "EASY",
        type: "DAY_HIKE",
        description: "Historic trail leading to three chapels and a viewpoint over Lac des Deux Montagnes."
    },
    {
        name: "Sentier des Crêtes",
        location: "Mont-Orford NP, QC",
        distance: 18.7,
        elevationGain: 990,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Challenging rocky ridge walk with spectacular panoramas."
    },
    {
        name: "Mont Chauve",
        location: "Mont-Orford NP, QC",
        distance: 10.6,
        elevationGain: 310,
        difficulty: "MODERATE",
        type: "DAY_HIKE",
        description: "A local favorite offering a 360-degree view without the crowds of the main ski peaks."
    },
    {
        name: "Le Scotora",
        location: "Jacques-Cartier NP, QC",
        distance: 16.0,
        elevationGain: 405,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Backcountry feel, leading to the summit of Mont Andante."
    },
    {
        name: "Mestachibo",
        location: "Saint-Ferréol-les-Neiges, QC",
        distance: 13.5,
        elevationGain: 450,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Technical trail linking Jean-Larose Falls to Saint-Ferréol church, crossing two canyons."
    },
    {
        name: "Sentier du Fjord",
        location: "Saguenay Fjord NP, QC",
        distance: 18.0,
        elevationGain: 600,
        difficulty: "MODERATE",
        type: "DAY_HIKE", // Or overnight
        description: "Spectacular trail hugging the cliffs of the Saguenay Fjord."
    },
    {
        name: "Mont du Lac des Cygnes",
        location: "Grands-Jardins NP, QC",
        distance: 8.6,
        elevationGain: 480,
        difficulty: "MODERATE",
        type: "DAY_HIKE",
        description: "Very popular trail culminating in a rocky summit with alpine vegetation."
    },
    {
        name: "Le Massif du Sud",
        location: "Saint-Philémon, QC",
        distance: 10.0,
        elevationGain: 915, // Peak elevation, not gain, need to check, usually ~400 gain
        difficulty: "MODERATE",
        type: "DAY_HIKE",
        description: "Old growth forest and deep snow in winter."
    },

    // West Coast Classics
    {
        name: "Wonderland Trail",
        location: "Mount Rainier NP, WA",
        distance: 93, // miles
        elevationGain: 6700, // meters (22000ft+)
        difficulty: "EXTREME",
        type: "MULTI_DAY",
        description: "Circumnavigates Mount Rainier. Requires permit."
    },
    {
        name: "Half Dome via John Muir Trail",
        location: "Yosemite NP, CA",
        distance: 17, // miles
        elevationGain: 1460,
        difficulty: "EXTREME",
        type: "DAY_HIKE",
        description: "Famous cables route. Permits required."
    },
    {
        name: "Angels Landing",
        location: "Zion NP, UT",
        distance: 4.4, // miles
        elevationGain: 450,
        difficulty: "HARD",
        type: "DAY_HIKE",
        description: "Steep, narrow ridge with chain assists. Very exposed."
    }
]
