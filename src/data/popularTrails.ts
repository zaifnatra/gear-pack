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
        description: "Iconic trail in Hautes-Gorges-de-la-Rivière-Malbaie National Park."
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
