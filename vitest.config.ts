import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'server',
          environment: 'node',
          include: [
            'src/app/actions/__tests__/**/*.test.ts',
            'src/app/api/__tests__/**/*.test.ts',
            'src/lib/ai/__tests__/**/*.test.ts',
          ],
          setupFiles: ['src/test/setup-server.ts'],
          fileParallelism: false,
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'client',
          environment: 'happy-dom',
          globals: true,
          include: ['src/components/**/__tests__/**/*.test.tsx'],
          setupFiles: ['src/test/setup-client.ts'],
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
      },
    ],
  },
})
