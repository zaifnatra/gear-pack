// scripts/setup-backboard.ts
import 'dotenv/config'

const BACKBOARD_API_URL = "https://app.backboard.io/api"
const PACKBOT_MODEL = "gpt-5"
const SCOPE_GUARD_MODEL = "gpt-4o-mini"

async function createAssistant(apiKey: string, payload: any) {
  const response = await fetch(`${BACKBOARD_API_URL}/assistants`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = await response.json()
  return data.assistant_id as string
}

async function main() {
  const apiKey = process.env.BACKBOARD_API_KEY
  if (!apiKey) {
    console.error("❌ BACKBOARD_API_KEY is missing in .env")
    process.exit(1)
  }

  console.log("🚀 Creating Gear Pack Assistants...")

  // Main assistant: PackBot
  const packBotId = await createAssistant(apiKey, {
    name: "PackBot",
    model: PACKBOT_MODEL,
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
7. Get a real forecast from Open-Meteo (get_weather_forecast tool).

RULES:
- FORMAT "Trail Options" as a JSON object inside a code block. Structure: \`\`\`json { "type": "trail_options", "message": "...", "options": [{ "id", "name", "location", "driveTime", "distance", "elevationGain", "difficulty", "description", "externalUrl" }], "quick_actions": [] }\`\`\`
- FORMAT "Gear Analysis" as a JSON object inside a code block. Structure: \`\`\`json { "type": "gear_analysis", "message": "...", "summary": "...", "categories": [{ "category", "status", "items": [], "suggestion" }], "quick_actions": [] }\`\`\`

- **Date Smarts**: Use [Today's Date] to infer relative dates.
- **Difficulty Inference**: Search difficulty for specific trails; default MODERATE.
- **MANDATORY DATA FILLING**:
  - BEFORE calling \`create_trip\`, you **MUST** search the web for the trail's:
    1. \`distance\` (in km)
    2. \`elevationGain\` (in meters)
    3. \`externalUrl\` (Find a link to AllTrails, Park website, or HikingProject)
    4. \`latitude\` and \`longitude\` (for weather)
  - If exact numbers aren't found, ESTIMATE based on similar trails in the region, but prefer finding real data.
  - DO NOT leave these fields blank or zero if they can be found online.
- When making gear recommendations that depend on conditions, ALWAYS call get_weather_forecast.
- DO NOT auto-create a trip unless explicit confirmation.
- Check user's actual gear before recommending lists.
- Scope: Hiking/outdoors/trips/gear. Brief small talk OK. Politely refuse other topics.
- Preferences are USER-focused and stable (not per-trip). Use the stored preference profile.
- Preference keys (allowed values): pack_style, rain_tolerance, snow_ice_comfort, exposure_tolerance, scrambling_comfort, shelter_preference, cooking_preference, nav_confidence, remoteness_tolerance, offline_maps_preference, sat_messenger_preference, water_treatment_preference, dry_stretch_tolerance, carry_system_preference, footwear_preference, feet_strategy, bug_tolerance, sun_tolerance.
- Confidence: "default" (weak), "confirmed" (strong/explicit), "inferred" (from behavior).
- Ask at most ONE single-choice preference question per response when instructed. CALL update_user_preferences after answer.

FORMATTING: Clean markdown. Headers (##). Bullet points (-). Concise descriptions. Group related items. Be conversational and safety-focused.`,
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
            required: ["name", "location", "startDate", "endDate", "difficulty", "distance", "elevationGain", "description", "externalUrl"]
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

  // Scope classifier assistant: PackBotScopeGuard (no tools)
  const scopeGuardId = await createAssistant(apiKey, {
    name: "PackBotScopeGuard",
    model: SCOPE_GUARD_MODEL,
    description: "Classifies whether a message is in-scope for hiking/outdoors/trips/gear (small talk allowed).",
    instructions: `You are PackBotScopeGuard.

Your ONLY job is to classify whether the user's message is in-scope for GearPack/PackBot.

IN-SCOPE:
- hiking, backpacking, camping, trails, mountains, trip planning/logistics, outdoor safety, navigation, packing/gear
- brief small talk (greetings, thanks, short jokes) is OK
- simple affirmations/negations or responses to questions (e.g. "yes", "sure", "no", "go ahead", "sounds good")
- **Locations/Landmarks**: Names of mountains, parks, or trails are ALWAYS in-scope, even if they share names with politicians or famous people (e.g. "Mont Nixon", "Mount Washington", "Lincoln Memorial").

OUT-OF-SCOPE:
- anything unrelated to outdoors/trips/gear (examples: math homework, politics, relationship advice, programming help)

When asked, return ONLY valid JSON (no markdown, no extra text):
{"in_scope": true, "reason": "short reason"}`
  })

  console.log("\n✅ Assistants Created Successfully!")
  console.log("------------------------------------------------")
  console.log(`PackBot ID: ${packBotId}`)
  console.log(`ScopeGuard ID: ${scopeGuardId}`)
  console.log("------------------------------------------------")
  console.log("\n👉 Please add these to your .env file:")
  console.log(`BACKBOARD_ASSISTANT_ID=${packBotId}`)
  console.log(`BACKBOARD_SCOPE_ASSISTANT_ID=${scopeGuardId}`)
}

main().catch(console.error)
