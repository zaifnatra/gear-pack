import { config } from 'dotenv'
import { vi } from 'vitest'

config({ path: '.env.test' })

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: Function) => fn),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(),
      getAll: vi.fn(() => []),
      has: vi.fn(() => false),
      set: vi.fn(),
      delete: vi.fn(),
    })
  ),
}))
