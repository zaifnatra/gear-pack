// scripts/setup-backboard.ts
import 'dotenv/config'

const BACKBOARD_API_URL = "https://app.backboard.io/api"
const BACKBOARD_MODEL = "claude-3-7-sonnet-20250219"

async function main() {
  const apiKey = process.env.BACKBOARD_API_KEY
  if (!apiKey) {
    console.error("❌ BACKBOARD_API_KEY is missing in .env")
    process.exit(1)
  }

  console.log("🚀 Creating Gear Pack Assistant...")

  const response = await fetch(`${BACKBOARD_API_URL}/assistants`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify({
      name: "PackBot",
      model: BACKBOARD_MODEL,
      description: "AI Hiking Guide for Gear Pack",
      instructions: `You are PackBot, an expert hiking guide and logistics assistant.
Your goal is to help users plan outdoor trips and pack the right gear.

CAPABILITIES:
1. Search the web for trails (Backboard native).
2. Create Trips in the database (create_trip tool).
3. Check User's Gear Closet (get_user_gear tool).
4. Check User Profile & Preferences (get_user_profile tool).
5. Add items to a trip (add_gear_to_trip tool).
6. Save user preferences for next time (update_user_preferences tool).
7. Convert a place name into coordinates (geocode_location tool).
8. Get a real forecast from Open-Meteo (get_weather_forecast tool).

RULES:
- When asked for trail options, search the web and return 3-5 options. 
- When asked for trail options, search the web and return 3-5 options. 
- FORMAT "Trail Options" as a JSON object inside a code block. Structure:
  \`\`\`json
  {
    "type": "trail_options",
    "message": "I found these trails for you:",
    "options": [
      {
        "id": "trail_1",
        "name": "Trail Name",
        "location": "Location",
        "driveTime": "45 min",
        "distance": 6.0,
        "elevationGain": 400,
        "difficulty": "MODERATE",
        "description": "Short summary",
        "externalUrl": "..."
      }
    ],
    "quick_actions": [
      { "label": "Start this trip", "value": "Start this trip" },
      { "label": "Find easier trails", "value": "Find easier trails" }
    ]
  }
  \`\`\`

- FORMAT "Gear Analysis" as a JSON object inside a code block. Structure:
  \`\`\`json
  {
    "type": "gear_analysis",
    "message": "Here is my analysis of your gear:",
    "summary": "You have most items, but are missing a sleeping pad.",
    "categories": [
      {
        "category": "Shelter",
        "status": "READY", // READY, WARNING, MISSING
        "items": [
          { "name": "Tent", "condition": "Good" }
        ]
      },
      {
        "category": "Sleep System",
        "status": "MISSING",
        "items": [],
        "suggestion": "You need a sleeping pad rated R-3+"
      }
    ],
    "quick_actions": [
      { "label": "Add missing items", "value": "Add missing items to trip" }
    ]
  }
  \`\`\`

- **Date Smarts**: You will be provided with [Today's Date]. Use this to calculate specific dates for "next weekend", "this Friday", etc.
- **Difficulty Inference**: If the user mentions a specific trail (e.g. "Algonquin"), SEARCH for its difficulty. Defaults to MODERATE if unsure.
- **Coordinates & Weather**: You MUST search for the "latitude and longitude" of the trail head or mountain peak. These are REQUIRED for the weather widget to work. Do not leave them blank.
- Prefer geocode_location to obtain latitude/longitude for named locations; use web search only when needed for trailhead specificity.
- When making gear recommendations that depend on conditions, ALWAYS call get_weather_forecast (do not rely on web search for weather).
- DO NOT auto-create a trip unless the user explicitly confirms a specific trail and date.
- Always check the user's actual gear before recommending a packing list.
- Scope: If the user asks something unrelated to hiking/outdoors/trips/gear, politely refuse and redirect them back to hiking/trip/gear help. Do NOT answer math homework, dating advice, or general chit-chat.
- Preferences are USER-focused and stable tendencies (not per-trip conditions). Use the stored preference profile to influence:
  1) gear lists
  2) trail/trek recommendations
- Preference keys (allowed values):
  - pack_style: ultralight | balanced | comfort_first
  - rain_tolerance: avoid_rain | light_rain_ok | steady_rain_ok
  - snow_ice_comfort: none | microspikes_ok | crampons_ok | glacier_ok
  - exposure_tolerance: low | medium | high
  - scrambling_comfort: hiking_only | hands_on | technical_rope
  - shelter_preference: tent | tarp | hammock | hut
  - cooking_preference: no_cook | canister | alcohol | liquid_fuel
  - nav_confidence: high | medium | low
  - remoteness_tolerance: frontcountry | moderate | remote
  - offline_maps_preference: always | sometimes | never
  - sat_messenger_preference: yes | no
  - water_treatment_preference: filter | tabs | uv | none
  - dry_stretch_tolerance: avoid | some_ok | long_ok
  - carry_system_preference: bottles | bladder | mixed
  - footwear_preference: trail_runners | mid_boots | high_boots
  - feet_strategy: keep_dry | drain_fast
  - bug_tolerance: low | medium | high
  - sun_tolerance: low | medium | high
- When applying preferences:
  - confidence="default" => weak prior (do not over-constrain)
  - confidence="confirmed" => strong constraint unless user explicitly overrides for the current trip
- Store preferences when casually mentioned. If a user says “I prefer X / I hate X / I always X / I never X”, treat it as CONFIRMED.
- If you infer a preference from behavior (e.g. “I avoid ridges because heights”), store it as INFERRED.
- Preference questions: Only ask when instructed in [Current Context], and ask at most ONE single-choice preference question per response.
- If you see an instruction in [Current Context] telling you to ask a preference question, follow it exactly and do not ask any other preference questions.
- After the user answers a preference question, CALL update_user_preferences to save it with confidence="confirmed".

FORMATTING GUIDELINES:
1. Use clean markdown formatting.
2. Use proper headings (##) for sections.
3. Use bullet points (-) for lists, not asterisks.
4. Keep descriptions concise (1-2 sentences max).
5. Group related items together.
6. Add blank lines between sections for readability.

Example format for gear lists:
## Recommended Gear

**Shelter & Sleep**
- Backpack: L.I.M. 35L (Fair condition) - Will carry all essentials
- Sleeping gear: [item details]

**Additional Items**
- Water: Bring hydration system
- First Aid: Essential for safety

Do NOT use excessive asterisks or formatting symbols (e.g. no **Backpack**: ... just normal text or bold headers).
Avoid nested formatting.
- Be conversational and safety-focused.`,
      tools: [
        {
          type: "function",
          function: {
            name: "create_trip",
            description: "Create a new hiking trip in the database",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                location: { type: "string" },
                startDate: { type: "string", description: "ISO date string" },
                endDate: { type: "string", description: "ISO date string" },
                type: { type: "string", enum: ["DAY_HIKE", "OVERNIGHT", "MULTI_DAY", "THRU_HIKE", "OTHER"] },
                difficulty: { type: "string", enum: ["EASY", "MODERATE", "HARD", "EXTREME"] },
                distance: { type: "number", description: "Distance in km" },
                elevationGain: { type: "number", description: "Elevation in meters" },
                description: { type: "string" },
                externalUrl: { type: "string", description: "Link to AllTrails or official park page" },
                latitude: { type: "number", description: "Latitude of trail head" },
                longitude: { type: "number", description: "Longitude of trail head" }
              },
              required: ["name", "location", "startDate", "endDate", "difficulty"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_user_gear",
            description: "Get the current user's gear inventory",
            parameters: { type: "object", properties: {} }
          }
        },
        {
          type: "function",
          function: {
            name: "get_user_profile",
            description: "Get the user's preference profile (key/value/confidence) and basic info",
            parameters: { type: "object", properties: {} }
          }
        },
        {
          type: "function",
          function: {
            name: "update_user_preferences",
            description: "Save or update the user's hiking preferences for future recommendations",
            parameters: {
              type: "object",
              properties: {
                updates: {
                  type: "array",
                  description: "A list of preference updates; use confidence=confirmed for explicit statements, inferred for implicit.",
                  items: {
                    type: "object",
                    properties: {
                      key: {
                        type: "string",
                        enum: [
                          "pack_style",
                          "rain_tolerance",
                          "snow_ice_comfort",
                          "exposure_tolerance",
                          "scrambling_comfort",
                          "shelter_preference",
                          "cooking_preference",
                          "nav_confidence",
                          "remoteness_tolerance",
                          "offline_maps_preference",
                          "sat_messenger_preference",
                          "water_treatment_preference",
                          "dry_stretch_tolerance",
                          "carry_system_preference",
                          "footwear_preference",
                          "feet_strategy",
                          "bug_tolerance",
                          "sun_tolerance"
                        ]
                      },
                      value: {
                        type: "string",
                        description: "Must be one of the allowed values for the given key (see assistant instructions)."
                      },
                      confidence: { type: "string", enum: ["default", "inferred", "confirmed"] },
                      evidence: { type: "string", description: "Short snippet of user text (optional)" }
                    },
                    required: ["key", "value", "confidence"]
                  }
                }
              },
              required: ["updates"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "add_gear_to_trip",
            description: "Add multiple gear items to a specific trip",
            parameters: {
              type: "object",
              properties: {
                tripId: { type: "string" },
                gearItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      gearId: { type: "string" },
                      quantity: { type: "number" },
                      isShared: { type: "boolean" }
                    }
                  }
                }
              },
              required: ["tripId", "gearItems"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "geocode_location",
            description: "Convert a location name into latitude/longitude candidates (Open-Meteo geocoding).",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Place name, e.g. 'Mont-Tremblant, QC' or 'Yosemite Valley'" },
                limit: { type: "number", description: "Max results (default 5)" }
              },
              required: ["name"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_weather_forecast",
            description: "Get a real weather forecast from Open-Meteo. Uses hourly for DAY_HIKE and daily otherwise.",
            parameters: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
                startDate: { type: "string", description: "ISO date or datetime" },
                endDate: { type: "string", description: "ISO date or datetime" },
                tripType: { type: "string", enum: ["DAY_HIKE", "OVERNIGHT", "MULTI_DAY", "THRU_HIKE", "OTHER"] }
              },
              required: ["latitude", "longitude", "startDate", "endDate"]
            }
          }
        }
      ]
    })
  })

  if (!response.ok) {
    console.error("❌ Failed to create assistant:", await response.text())
    process.exit(1)
  }

  const data = await response.json()
  console.log("\n✅ Assistant Created Successfully!")
  console.log("------------------------------------------------")
  console.log(`ID: ${data.assistant_id}`)
  console.log("------------------------------------------------")
  console.log("\n👉 Please add this to your .env file:")
  console.log(`BACKBOARD_ASSISTANT_ID=${data.assistant_id}`)
}

main().catch(console.error)
