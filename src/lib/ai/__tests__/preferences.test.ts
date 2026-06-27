import { describe, it, expect } from 'vitest'
import {
  normalizePreferenceStore,
  createDefaultPreferenceStore,
  applyPreferenceUpdates,
  isPreferenceValueAllowed,
  extractPreferenceUpdatesFromMessage,
} from '@/lib/ai/preferences'

describe('isPreferenceValueAllowed', () => {
  it('returns true for a valid value', () => {
    expect(isPreferenceValueAllowed('pack_style', 'ultralight')).toBe(true)
  })

  it('returns false for an invalid value', () => {
    expect(isPreferenceValueAllowed('pack_style', 'super_ultralight')).toBe(false)
  })
})

describe('normalizePreferenceStore', () => {
  it('returns default store with changed=true for null input', () => {
    const { store, changed } = normalizePreferenceStore(null)
    expect(changed).toBe(true)
    expect(store.profile.pack_style.value).toBe('balanced')
    expect(store.profile.pack_style.confidence).toBe('default')
  })

  it('preserves valid confirmed entry without marking changed', () => {
    const base = createDefaultPreferenceStore('2024-01-01T00:00:00.000Z')
    base.profile.pack_style = {
      value: 'ultralight',
      confidence: 'confirmed',
      updated_at: '2024-01-01T00:00:00.000Z',
    }
    const { store, changed } = normalizePreferenceStore(base)
    expect(changed).toBe(false)
    expect(store.profile.pack_style.value).toBe('ultralight')
    expect(store.profile.pack_style.confidence).toBe('confirmed')
  })

  it('resets an entry with invalid confidence to defaults and marks changed', () => {
    const raw = {
      profile: {
        pack_style: {
          value: 'balanced',
          confidence: 'very_certain',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }
    const { store, changed } = normalizePreferenceStore(raw)
    expect(changed).toBe(true)
    expect(store.profile.pack_style.confidence).toBe('default')
  })
})

describe('applyPreferenceUpdates', () => {
  it('applies a valid inferred update', () => {
    const store = createDefaultPreferenceStore()
    const { applied, store: next } = applyPreferenceUpdates(store, [
      { key: 'pack_style', value: 'ultralight', confidence: 'inferred' },
    ])
    expect(applied).toHaveLength(1)
    expect(next.profile.pack_style.value).toBe('ultralight')
    expect(next.profile.pack_style.confidence).toBe('inferred')
  })

  it('does not overwrite a confirmed preference with an inferred update', () => {
    const store = createDefaultPreferenceStore()
    store.profile.pack_style = {
      value: 'ultralight',
      confidence: 'confirmed',
      updated_at: '2024-01-01T00:00:00.000Z',
    }
    const { conflictsAdded, store: next } = applyPreferenceUpdates(store, [
      { key: 'pack_style', value: 'comfort_first', confidence: 'inferred' },
    ])
    expect(conflictsAdded).toHaveLength(1)
    expect(next.profile.pack_style.value).toBe('ultralight')
  })

  it('overwrites a confirmed preference with a confirmed update', () => {
    const store = createDefaultPreferenceStore()
    store.profile.pack_style = {
      value: 'ultralight',
      confidence: 'confirmed',
      updated_at: '2024-01-01T00:00:00.000Z',
    }
    const { store: next } = applyPreferenceUpdates(store, [
      { key: 'pack_style', value: 'comfort_first', confidence: 'confirmed' },
    ])
    expect(next.profile.pack_style.value).toBe('comfort_first')
  })

  it('skips updates with disallowed values', () => {
    const store = createDefaultPreferenceStore()
    const { applied } = applyPreferenceUpdates(store, [
      { key: 'pack_style', value: 'not_a_real_value', confidence: 'confirmed' },
    ])
    expect(applied).toHaveLength(0)
  })
})

describe('extractPreferenceUpdatesFromMessage', () => {
  it('detects ultralight pack style from first-person message', () => {
    const updates = extractPreferenceUpdatesFromMessage(
      'I always prefer ultralight gear for every trip'
    )
    const packUpdate = updates.find(u => u.key === 'pack_style')
    expect(packUpdate?.value).toBe('ultralight')
  })

  it('returns empty array for non-first-person message', () => {
    const updates = extractPreferenceUpdatesFromMessage(
      'ultralight gear is great for most hikers'
    )
    expect(updates).toHaveLength(0)
  })
})
