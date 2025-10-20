import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/components/ui/**',
        'dist/'
      ],
      include: [
        'src/**/*.{ts,tsx}',
        'src/lib/**/*.{ts,tsx}'
      ],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
