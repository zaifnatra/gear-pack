import { describe, it, expect } from 'vitest'
import {
    normalizePreferenceStore,
    applyPreferenceUpdates,
    pickHighImpactMissingPreference,
    createDefaultPreferenceStore,
    PREFERENCE_KEYS,
} from '../preferences'

describe('normalizePreferenceStore', () => {
    it('returns a full default store when input is null', () => {
        const { store, changed } = normalizePreferenceStore(null)
        expect(changed).toBe(true)
        expect(store.profile.pack_style.value).toBe('balanced')
        expect(store.profile.pack_style.confidence).toBe('default')
    })

    it('returns a full default store when input is undefined', () => {
        const { store, changed } = normalizePreferenceStore(undefined)
        expect(changed).toBe(true)
        for (const key of PREFERENCE_KEYS) {
            expect(store.profile[key]).toBeDefined()
        }
    })

    it('preserves valid confirmed preferences unchanged', () => {
        const base = createDefaultPreferenceStore()
        base.profile.pack_style = { value: 'ultralight', confidence: 'confirmed', updated_at: '2024-01-01T00:00:00Z' }
        const { store, changed } = normalizePreferenceStore(base)
        expect(changed).toBe(false)
        expect(store.profile.pack_style.value).toBe('ultralight')
        expect(store.profile.pack_style.confidence).toBe('confirmed')
    })

    it('resets a corrupted entry (invalid value) to default', () => {
        const base = createDefaultPreferenceStore() as Record<string, unknown>
        const baseProfile = (base.profile as Record<string, unknown>)
        baseProfile.pack_style = { value: 'invalid_value', confidence: 'default', updated_at: '2024-01-01T00:00:00Z' }
        const { store, changed } = normalizePreferenceStore(base)
        expect(changed).toBe(true)
        expect(store.profile.pack_style.value).toBe('balanced')
    })

    it('fills in missing keys when store has partial profile', () => {
        const partial = { profile: { pack_style: { value: 'ultralight', confidence: 'confirmed', updated_at: '2024-01-01T00:00:00Z' } } }
        const { store } = normalizePreferenceStore(partial)
        // All other keys should be filled with defaults
        expect(store.profile.rain_tolerance.value).toBe('light_rain_ok')
        expect(store.profile.rain_tolerance.confidence).toBe('default')
    })
})

describe('applyPreferenceUpdates', () => {
    it('applies an inferred update to a default preference', () => {
        const store = createDefaultPreferenceStore()
        const { store: next, applied } = applyPreferenceUpdates(store, [
            { key: 'pack_style', value: 'ultralight', confidence: 'inferred' }
        ])
        expect(next.profile.pack_style.value).toBe('ultralight')
        expect(next.profile.pack_style.confidence).toBe('inferred')
        expect(applied).toHaveLength(1)
    })

    it('does NOT overwrite a confirmed preference with an inferred update', () => {
        const store = createDefaultPreferenceStore()
        store.profile.pack_style = { value: 'ultralight', confidence: 'confirmed', updated_at: '2024-01-01T00:00:00Z' }

        const { store: next, applied, conflictsAdded } = applyPreferenceUpdates(store, [
            { key: 'pack_style', value: 'balanced', confidence: 'inferred' }
        ])

        expect(next.profile.pack_style.value).toBe('ultralight')
        expect(applied).toHaveLength(0)
        expect(conflictsAdded).toHaveLength(1)
        expect(conflictsAdded[0].old_value).toBe('ultralight')
        expect(conflictsAdded[0].new_value).toBe('balanced')
    })

    it('DOES overwrite a confirmed preference with a new confirmed update', () => {
        const store = createDefaultPreferenceStore()
        store.profile.pack_style = { value: 'ultralight', confidence: 'confirmed', updated_at: '2024-01-01T00:00:00Z' }

        const { store: next, applied } = applyPreferenceUpdates(store, [
            { key: 'pack_style', value: 'balanced', confidence: 'confirmed' }
        ])

        expect(next.profile.pack_style.value).toBe('balanced')
        expect(next.profile.pack_style.confidence).toBe('confirmed')
        expect(applied).toHaveLength(1)
    })

    it('ignores updates with disallowed values', () => {
        const store = createDefaultPreferenceStore()
        const { store: next, applied } = applyPreferenceUpdates(store, [
            { key: 'pack_style', value: 'not_a_real_option' as 'ultralight', confidence: 'inferred' }
        ])
        expect(next.profile.pack_style.value).toBe('balanced')
        expect(applied).toHaveLength(0)
    })

    it('does not mutate the original store', () => {
        const store = createDefaultPreferenceStore()
        const originalValue = store.profile.pack_style.value
        applyPreferenceUpdates(store, [{ key: 'pack_style', value: 'ultralight', confidence: 'inferred' }])
        expect(store.profile.pack_style.value).toBe(originalValue)
    })
})

describe('pickHighImpactMissingPreference', () => {
    it('returns the first high-impact default preference', () => {
        const store = createDefaultPreferenceStore()
        const key = pickHighImpactMissingPreference(store)
        expect(key).toBe('pack_style')
    })

    it('returns undefined when all high-impact preferences are confirmed', () => {
        const store = createDefaultPreferenceStore()
        const highImpact = ['pack_style', 'rain_tolerance', 'snow_ice_comfort', 'exposure_tolerance', 'water_treatment_preference', 'nav_confidence', 'footwear_preference', 'bug_tolerance'] as const
        for (const key of highImpact) {
            store.profile[key] = { ...store.profile[key], confidence: 'confirmed' }
        }
        expect(pickHighImpactMissingPreference(store)).toBeUndefined()
    })

    it('skips already-asked keys and returns the next candidate', () => {
        const store = createDefaultPreferenceStore()
        store.question_state = { asked_keys: ['pack_style'], user_turn: 1, last_question_turn: 1 }
        const key = pickHighImpactMissingPreference(store)
        expect(key).toBe('rain_tolerance')
    })
})
