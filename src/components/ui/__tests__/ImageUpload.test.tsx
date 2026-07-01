import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ImageUpload } from '@/components/ui/ImageUpload'

// Legacy unauthenticated singleton (no SSR session) — uploading through this
// client hits storage RLS because it carries no auth JWT.
const legacyUpload = vi.fn().mockResolvedValue({ error: { message: 'new row violates row-level security policy' } })
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: legacyUpload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/legacy.jpg' } }),
      }),
    },
  },
}))

// SSR-aware browser client used everywhere else in the app (e.g. profile-form.tsx) —
// reads the session from cookies, so the upload is authenticated.
const authedUpload = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: authedUpload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/authed.jpg' } }),
      }),
    },
  }),
}))

describe('ImageUpload', () => {
  it('uploads through the authenticated SSR client, not the unauthenticated legacy singleton', async () => {
    const user = userEvent.setup()
    const onUploadComplete = vi.fn()
    const { container } = render(<ImageUpload onUploadComplete={onUploadComplete} />)

    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, file)

    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith('https://example.com/authed.jpg'))
    expect(authedUpload).toHaveBeenCalled()
    expect(legacyUpload).not.toHaveBeenCalled()
  })
})
