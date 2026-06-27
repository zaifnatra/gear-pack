import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'client',
    environment: 'happy-dom',
    include: ['src/components/**/__tests__/**/*.test.tsx'],
    setupFiles: ['src/test/setup-client.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
