import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

config({ path: '.env.test' })

export default defineConfig({
  test: {
    name: 'server',
    environment: 'node',
    include: [
      'src/app/actions/__tests__/**/*.test.ts',
      'src/lib/ai/__tests__/**/*.test.ts',
    ],
    setupFiles: ['src/test/setup-server.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
