export const PREFERENCE_KEYS = [
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
    "sun_tolerance",
] as const

export type PreferenceKey = (typeof PREFERENCE_KEYS)[number]

export const PREFERENCE_OPTIONS: Record<PreferenceKey, readonly string[]> = {
    pack_style: ["ultralight", "balanced", "comfort_first"],
    rain_tolerance: ["avoid_rain", "light_rain_ok", "steady_rain_ok"],
    snow_ice_comfort: ["none", "microspikes_ok", "crampons_ok", "glacier_ok"],
    exposure_tolerance: ["low", "medium", "high"],
    scrambling_comfort: ["hiking_only", "hands_on", "technical_rope"],
    shelter_preference: ["tent", "tarp", "hammock", "hut"],
    cooking_preference: ["no_cook", "canister", "alcohol", "liquid_fuel"],
    nav_confidence: ["high", "medium", "low"],
    remoteness_tolerance: ["frontcountry", "moderate", "remote"],
    offline_maps_preference: ["always", "sometimes", "never"],
    sat_messenger_preference: ["yes", "no"],
    water_treatment_preference: ["filter", "tabs", "uv", "none"],
    dry_stretch_tolerance: ["avoid", "some_ok", "long_ok"],
    carry_system_preference: ["bottles", "bladder", "mixed"],
    footwear_preference: ["trail_runners", "mid_boots", "high_boots"],
    feet_strategy: ["keep_dry", "drain_fast"],
    bug_tolerance: ["low", "medium", "high"],
    sun_tolerance: ["low", "medium", "high"],
}

export const DEFAULT_PREFERENCES: Record<PreferenceKey, string> = {
    pack_style: "balanced",
    rain_tolerance: "light_rain_ok",
    snow_ice_comfort: "none",
    exposure_tolerance: "medium",
    scrambling_comfort: "hiking_only",
    shelter_preference: "tent",
    cooking_preference: "canister",
    nav_confidence: "medium",
    remoteness_tolerance: "moderate",
    offline_maps_preference: "sometimes",
    sat_messenger_preference: "no",
    water_treatment_preference: "filter",
    dry_stretch_tolerance: "some_ok",
    carry_system_preference: "mixed",
    footwear_preference: "trail_runners",
    feet_strategy: "drain_fast",
    bug_tolerance: "medium",
    sun_tolerance: "medium",
}

export type PreferenceConfidence = "default" | "inferred" | "confirmed"

export interface PreferenceEntry {
    value: string
    confidence: PreferenceConfidence
    updated_at: string
    evidence?: string
}

export type PreferenceProfile = Record<PreferenceKey, PreferenceEntry>

export interface PreferenceConflict {
    key: PreferenceKey
    old_value: string
    new_value: string
    evidence?: string
    timestamp: string
}

export interface PreferenceQuestionState {
    thread_id?: string
    user_turn?: number
    last_question_turn?: number
    last_question_key?: PreferenceKey
    asked_keys?: PreferenceKey[]
}

export interface PreferenceStore {
    profile: PreferenceProfile
    conflicts?: PreferenceConflict[]
    question_state?: PreferenceQuestionState
}

export interface PreferenceUpdate {
    key: PreferenceKey
    value: string
    confidence: PreferenceConfidence
    evidence?: string
}

export function nowIso() {
    return new Date().toISOString()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isConfidence(value: unknown): value is PreferenceConfidence {
    return value === "default" || value === "inferred" || value === "confirmed"
}

export function isPreferenceValueAllowed(key: PreferenceKey, value: unknown): value is string {
    return typeof value === "string" && PREFERENCE_OPTIONS[key].includes(value)
}

export function createDefaultPreferenceStore(timestamp = nowIso()): PreferenceStore {
    const profile = {} as PreferenceProfile
    for (const key of PREFERENCE_KEYS) {
        profile[key] = {
            value: DEFAULT_PREFERENCES[key],
            confidence: "default",
            updated_at: timestamp,
        }
    }
    return { profile, conflicts: [], question_state: { user_turn: 0, last_question_turn: -9999, asked_keys: [] } }
}

export function normalizePreferenceStore(raw: unknown, timestamp = nowIso()): { store: PreferenceStore; changed: boolean } {
    const base = createDefaultPreferenceStore(timestamp)
    if (!isPlainObject(raw)) return { store: base, changed: true }

    const store: PreferenceStore = { ...base }
    let changed = false

    const rawProfile = isPlainObject(raw.profile) ? raw.profile : undefined
    if (!rawProfile) {
        changed = true
    } else {
        for (const key of PREFERENCE_KEYS) {
            const entry = rawProfile[key]
            if (!isPlainObject(entry)) {
                changed = true
                continue
            }
            const value = entry.value
            const confidence = entry.confidence
            const updatedAt = entry.updated_at

            if (!isPreferenceValueAllowed(key, value) || !isConfidence(confidence) || typeof updatedAt !== "string") {
                changed = true
                continue
            }

            const evidence = typeof entry.evidence === "string" ? entry.evidence : undefined
            store.profile[key] = { value, confidence, updated_at: updatedAt, evidence }
        }
    }

    if (Array.isArray(raw.conflicts)) {
        store.conflicts = raw.conflicts
            .filter(isPlainObject)
            .map((c) => ({
                key: c.key,
                old_value: c.old_value,
                new_value: c.new_value,
                evidence: typeof c.evidence === "string" ? c.evidence : undefined,
                timestamp: c.timestamp,
            }))
            .filter((c): c is PreferenceConflict => {
                return (
                    PREFERENCE_KEYS.includes(c.key as PreferenceKey) &&
                    typeof c.old_value === "string" &&
                    typeof c.new_value === "string" &&
                    typeof c.timestamp === "string"
                )
            })
    } else if (raw.conflicts !== undefined) {
        changed = true
    }

    if (isPlainObject(raw.question_state)) {
        const qs = raw.question_state
        const askedKeys = Array.isArray(qs.asked_keys)
            ? qs.asked_keys.filter((k): k is PreferenceKey => PREFERENCE_KEYS.includes(k as PreferenceKey))
            : undefined

        store.question_state = {
            thread_id: typeof qs.thread_id === "string" ? qs.thread_id : undefined,
            user_turn: typeof qs.user_turn === "number" ? qs.user_turn : 0,
            last_question_turn: typeof qs.last_question_turn === "number" ? qs.last_question_turn : -9999,
            last_question_key: PREFERENCE_KEYS.includes(qs.last_question_key as PreferenceKey)
                ? (qs.last_question_key as PreferenceKey)
                : undefined,
            asked_keys: askedKeys,
        }
    } else if (raw.question_state !== undefined) {
        changed = true
    }

    return { store, changed }
}

export function applyPreferenceUpdates(
    store: PreferenceStore,
    updates: PreferenceUpdate[],
    timestamp = nowIso()
): { store: PreferenceStore; applied: PreferenceUpdate[]; conflictsAdded: PreferenceConflict[] } {
    const next: PreferenceStore = {
        ...store,
        profile: { ...store.profile },
        conflicts: Array.isArray(store.conflicts) ? [...store.conflicts] : [],
        question_state: store.question_state ? { ...store.question_state } : undefined,
    }

    const applied: PreferenceUpdate[] = []
    const conflictsAdded: PreferenceConflict[] = []

    for (const update of updates) {
        if (!PREFERENCE_KEYS.includes(update.key)) continue
        if (!isPreferenceValueAllowed(update.key, update.value)) continue
        if (!isConfidence(update.confidence)) continue

        const current = next.profile[update.key]
        const conflictsWithConfirmed = current.confidence === "confirmed" && current.value !== update.value

        if (conflictsWithConfirmed) {
            const conflict: PreferenceConflict = {
                key: update.key,
                old_value: current.value,
                new_value: update.value,
                evidence: update.evidence,
                timestamp,
            }
            next.conflicts?.push(conflict)
            conflictsAdded.push(conflict)

            // Only overwrite an existing confirmed preference if the new info is also confirmed.
            if (update.confidence !== "confirmed") {
                continue
            }
        }

        const confidence: PreferenceConfidence =
            current.confidence === "confirmed" && update.value === current.value ? "confirmed" : update.confidence

        next.profile[update.key] = {
            value: update.value,
            confidence,
            updated_at: timestamp,
            evidence: update.evidence ?? current.evidence,
        }
        applied.push(update)
    }

    return { store: next, applied, conflictsAdded }
}

function normalizeText(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function normalizeToken(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function truncateEvidence(text: string, maxLen = 160) {
    const trimmed = text.trim()
    if (trimmed.length <= maxLen) return trimmed
    return `${trimmed.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

function includesAny(text: string, needles: readonly string[]) {
    return needles.some((n) => text.includes(n))
}

function hasExplicitPreferenceLanguage(text: string) {
    return /\b(i|im|i'm)\s+(really\s+)?(prefer|like|love|hate|always|never|usually|tend to|don't mind|do not mind)\b/i.test(
        text
    )
}

function hasImplicitPreferenceLanguage(text: string) {
    return /\b(i|im|i'm)\s+(avoid|only|won't|dont|don't|do not|can't|cannot)\b/i.test(text) || /\bbecause\b/i.test(text)
}

function matchChoiceAnswer(message: string, options: readonly string[]): string | undefined {
    const normalizedMsg = normalizeToken(message)

    // yes/no special casing
    if (options.includes("yes") || options.includes("no")) {
        if (/^(yes|yeah|yep|sure)\b/i.test(message)) return "yes"
        if (/^(no|nope|nah)\b/i.test(message)) return "no"
    }

    for (const option of options) {
        if (normalizedMsg === normalizeToken(option)) return option
    }

    // Allow slightly longer answers containing the option (e.g. "balanced for most trips")
    const normalizedWords = normalizeText(message).split(" ")
    for (const option of options) {
        const optWords = normalizeText(option).split(" ")
        if (optWords.length === 1 && normalizedWords.includes(optWords[0])) return option
    }

    return undefined
}

function detectPackStyle(text: string): string | undefined {
    if (includesAny(text, ["ultralight", "ultra light", "lightweight", "baseweight", "base weight", "minimal"])) return "ultralight"
    if (includesAny(text, ["comfort first", "comfort-first", "comfort", "luxury", "cozy"])) return "comfort_first"
    if (includesAny(text, ["balanced", "middle ground", "in between", "somewhere in between"])) return "balanced"
    return undefined
}

function detectRainTolerance(text: string): string | undefined {
    if (includesAny(text, ["avoid rain", "hate rain", "don't like rain", "do not like rain"])) return "avoid_rain"
    if (/\bonly\s+hike\b.*\b(dry|sunny)\b/i.test(text) || /\bif\s+it'?s\s+dry\b/i.test(text)) return "avoid_rain"
    if (includesAny(text, ["steady rain", "heavy rain", "pouring", "downpour", "any weather", "rain doesn't bother"])) return "steady_rain_ok"
    if (includesAny(text, ["light rain", "drizzle", "some rain", "a bit of rain"])) return "light_rain_ok"
    return undefined
}

function detectSnowIceComfort(text: string): string | undefined {
    if (includesAny(text, ["glacier", "crevasse", "rope team"])) return "glacier_ok"
    if (includesAny(text, ["crampon", "frontpoint", "ice axe"])) return "crampons_ok"
    if (includesAny(text, ["microspike", "yaktrax", "traction"])) return "microspikes_ok"
    if (includesAny(text, ["avoid snow", "no snow", "skip snow", "don't do snow", "do not do snow", "avoid ice", "no ice"])) return "none"
    return undefined
}

function detectExposureTolerance(text: string): string | undefined {
    if (includesAny(text, ["afraid of heights", "scared of heights", "vertigo", "hate exposure", "no exposure"])) return "low"
    if (includesAny(text, ["love exposure", "exposure is fine", "okay with exposure", "ok with exposure", "love ridges"])) return "high"
    if (includesAny(text, ["some exposure", "moderate exposure"])) return "medium"
    return undefined
}

function detectScramblingComfort(text: string): string | undefined {
    if (includesAny(text, ["rope", "roped", "belay", "technical climb", "lead climb"])) return "technical_rope"
    if (includesAny(text, ["scramble", "hands-on", "hands on"])) return "hands_on"
    if (includesAny(text, ["hiking only", "no scrambling", "avoid scrambling"])) return "hiking_only"
    return undefined
}

function detectShelterPreference(text: string): string | undefined {
    if (includesAny(text, ["hammock"])) return "hammock"
    if (includesAny(text, ["tarp"])) return "tarp"
    if (includesAny(text, ["hut", "refuge"])) return "hut"
    if (includesAny(text, ["tent"])) return "tent"
    return undefined
}

function detectCookingPreference(text: string): string | undefined {
    if (includesAny(text, ["no cook", "nocook", "cold soak", "cold-soak"])) return "no_cook"
    if (includesAny(text, ["canister", "isobutane", "jetboil"])) return "canister"
    if (includesAny(text, ["alcohol stove", "alcohol"])) return "alcohol"
    if (includesAny(text, ["white gas", "liquid fuel", "msr whisperlite"])) return "liquid_fuel"
    return undefined
}

function detectNavConfidence(text: string): string | undefined {
    if (includesAny(text, ["good at navigation", "confident navigating", "map and compass", "strong navigator"])) return "high"
    if (includesAny(text, ["not good at navigation", "bad at navigation", "navigation is hard", "get lost", "not confident navigating"])) return "low"
    if (includesAny(text, ["somewhat confident", "ok at navigation", "okay at navigation"])) return "medium"
    return undefined
}

function detectRemotenessTolerance(text: string): string | undefined {
    if (includesAny(text, ["frontcountry", "close to the car", "near the car", "near trailhead", "day-use"])) return "frontcountry"
    if (includesAny(text, ["remote", "off-grid", "off grid", "deep backcountry", "deep backcountry"])) return "remote"
    if (includesAny(text, ["moderate", "somewhat remote"])) return "moderate"
    return undefined
}

function detectOfflineMapsPreference(text: string): string | undefined {
    if (includesAny(text, ["always download maps", "always offline maps", "always have offline maps"])) return "always"
    if (includesAny(text, ["never download maps", "never offline maps"])) return "never"
    if (includesAny(text, ["sometimes download maps", "sometimes offline maps"])) return "sometimes"
    return undefined
}

function detectSatMessengerPreference(text: string): string | undefined {
    if (includesAny(text, ["inreach", "sat messenger", "satellite messenger", "plb"])) {
        if (includesAny(text, ["don't", "do not", "never"]) && includesAny(text, ["carry", "bring", "use"])) return "no"
        if (includesAny(text, ["carry", "bring", "use", "always"])) return "yes"
    }
    return undefined
}

function detectWaterTreatmentPreference(text: string): string | undefined {
    if (includesAny(text, ["sawyer", "katadyn", "filter"])) return "filter"
    if (includesAny(text, ["tabs", "tablet", "aquamira", "chlorine dioxide"])) return "tabs"
    if (includesAny(text, ["steripen", "uv"])) return "uv"
    if (includesAny(text, ["untreated", "no treatment", "drink straight"])) return "none"
    return undefined
}

function detectDryStretchTolerance(text: string): string | undefined {
    if (includesAny(text, ["avoid dry", "hate dry carries", "no long water carries"])) return "avoid"
    if (includesAny(text, ["long dry", "long carries are ok", "big water carries are ok"])) return "long_ok"
    if (includesAny(text, ["some dry", "some water carries are ok"])) return "some_ok"
    return undefined
}

function detectCarrySystemPreference(text: string): string | undefined {
    if (includesAny(text, ["bladder", "camelbak"])) return "bladder"
    if (includesAny(text, ["bottles", "smartwater", "water bottle"])) return "bottles"
    if (includesAny(text, ["mixed"])) return "mixed"
    return undefined
}

function detectFootwearPreference(text: string): string | undefined {
    if (includesAny(text, ["trail runners", "trailrunners"])) return "trail_runners"
    if (includesAny(text, ["high boots", "high-top boots", "high top boots"])) return "high_boots"
    if (includesAny(text, ["mid boots", "mid-height boots", "mid height boots", "midcut boots"])) return "mid_boots"
    if (includesAny(text, ["boots"])) return "mid_boots"
    return undefined
}

function detectFeetStrategy(text: string): string | undefined {
    if (includesAny(text, ["keep my feet dry", "keep feet dry", "dry feet"])) return "keep_dry"
    if (includesAny(text, ["drain fast", "drain quickly", "wet is fine", "quick dry"])) return "drain_fast"
    return undefined
}

function detectBugTolerance(text: string): string | undefined {
    if (includesAny(text, ["hate bugs", "bugs ruin", "mosquitoes ruin", "can't stand mosquitoes", "buggy"])) return "low"
    if (includesAny(text, ["bugs don't bother", "mosquitoes don't bother", "fine with bugs"])) return "high"
    if (includesAny(text, ["some bugs are ok", "bug spray is enough"])) return "medium"
    return undefined
}

function detectSunTolerance(text: string): string | undefined {
    if (includesAny(text, ["burn easily", "hate sun", "avoid sun"])) return "low"
    if (includesAny(text, ["love sun", "fine in sun", "sun is fine"])) return "high"
    if (includesAny(text, ["some sun is ok"])) return "medium"
    return undefined
}

export function extractPreferenceUpdatesFromMessage(
    message: string,
    context: { lastAskedKey?: PreferenceKey; lastAskedKeyIsDefault?: boolean } = {}
): PreferenceUpdate[] {
    const trimmed = message.trim()
    if (!trimmed) return []

    const updates: PreferenceUpdate[] = []
    const evidence = truncateEvidence(trimmed)

    // If we recently asked a single-choice preference question, accept short answers.
    if (context.lastAskedKey && context.lastAskedKeyIsDefault) {
        const options = PREFERENCE_OPTIONS[context.lastAskedKey]
        const choice = matchChoiceAnswer(trimmed, options)
        if (choice) {
            updates.push({
                key: context.lastAskedKey,
                value: choice,
                confidence: "confirmed",
                evidence,
            })
        }
    }

    const lower = trimmed.toLowerCase()
    const hasTripOverrideLanguage = /\b(for this trip|on this trip|this trip|for this hike|for this trek|this time)\b/i.test(
        lower
    )
    const firstPerson = /\b(i|im|i'm|i’ve|ive|my|me)\b/i.test(lower)
    const explicit = hasExplicitPreferenceLanguage(lower)
    const implicit = hasImplicitPreferenceLanguage(lower)
    if (!firstPerson || (!explicit && !implicit)) return updates

    // Avoid treating per-trip overrides as stable user preferences unless user uses clearly-stable phrasing.
    const hasClearlyStableLanguage = /\b(always|never|usually|tend to|in general|generally)\b/i.test(lower)
    if (hasTripOverrideLanguage && !hasClearlyStableLanguage) return updates

    const confidence: PreferenceConfidence = explicit ? "confirmed" : "inferred"

    const detected: Array<{ key: PreferenceKey; value?: string }> = [
        { key: "pack_style", value: detectPackStyle(lower) },
        { key: "rain_tolerance", value: detectRainTolerance(lower) },
        { key: "snow_ice_comfort", value: detectSnowIceComfort(lower) },
        { key: "exposure_tolerance", value: detectExposureTolerance(lower) },
        { key: "scrambling_comfort", value: detectScramblingComfort(lower) },
        { key: "shelter_preference", value: detectShelterPreference(lower) },
        { key: "cooking_preference", value: detectCookingPreference(lower) },
        { key: "nav_confidence", value: detectNavConfidence(lower) },
        { key: "remoteness_tolerance", value: detectRemotenessTolerance(lower) },
        { key: "offline_maps_preference", value: detectOfflineMapsPreference(lower) },
        { key: "sat_messenger_preference", value: detectSatMessengerPreference(lower) },
        { key: "water_treatment_preference", value: detectWaterTreatmentPreference(lower) },
        { key: "dry_stretch_tolerance", value: detectDryStretchTolerance(lower) },
        { key: "carry_system_preference", value: detectCarrySystemPreference(lower) },
        { key: "footwear_preference", value: detectFootwearPreference(lower) },
        { key: "feet_strategy", value: detectFeetStrategy(lower) },
        { key: "bug_tolerance", value: detectBugTolerance(lower) },
        { key: "sun_tolerance", value: detectSunTolerance(lower) },
    ]

    for (const item of detected) {
        if (!item.value) continue
        if (!isPreferenceValueAllowed(item.key, item.value)) continue
        updates.push({ key: item.key, value: item.value, confidence, evidence })
    }

    return updates
}

export const HIGH_IMPACT_PREFERENCE_PRIORITY: readonly PreferenceKey[] = [
    "pack_style",
    "rain_tolerance",
    "snow_ice_comfort",
    "exposure_tolerance",
    "water_treatment_preference",
    "nav_confidence",
    "footwear_preference",
    "bug_tolerance",
]

export function isGearTripTrailTopic(message: string) {
    const text = message.toLowerCase()
    return includesAny(text, [
        "gear",
        "pack",
        "packing",
        "base weight",
        "backpack",
        "backpacking",
        "camping",
        "camp",
        "trail",
        "trailhead",
        "alltrails",
        "hike",
        "hiking",
        "trek",
        "trip",
        "itinerary",
        "route",
        "overnight",
        "multi day",
        "multiday",
        "thru",
        "thru-hike",
        "thruhike",
        "climb",
        "climbing",
        "scramble",
        "scrambling",
        "summit",
        "peak",
        "ridge",
        "mountain",
        "mount ",
        "mt ",
        " mt ",
        "mt.",
        "mont ",
        "recommend",
    ])
}

export function isAdviceRequestThatDependsOnPreferences(message: string) {
    const text = message.toLowerCase()
    return includesAny(text, [
        "what should i bring",
        "what do i need",
        "packing list",
        "pack list",
        "gear list",
        "gear analysis",
        "plan a trip",
        "plan my trip",
        "plan a weekend",
        "weekend trip",
        "overnight",
        "multi day",
        "multiday",
        "thru hike",
        "recommend",
        "suggest",
        "find a trail",
        "find a hike",
        "trail recommendations",
        "which trail",
        "which hike",
    ])
}

export function pickHighImpactMissingPreference(store: PreferenceStore): PreferenceKey | undefined {
    for (const key of HIGH_IMPACT_PREFERENCE_PRIORITY) {
        const entry = store.profile[key]
        if (!entry) continue
        if (entry.confidence !== "default") continue
        const asked = store.question_state?.asked_keys || []
        if (asked.includes(key)) continue
        return key
    }
    return undefined
}

export function buildSingleChoiceQuestion(key: PreferenceKey) {
    const options = PREFERENCE_OPTIONS[key]
    return {
        key,
        options,
        question: `Quick preference check: choose one \`${key}\` value (${options.join(", ")}).`,
    }
}
