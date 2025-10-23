import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Provide a minimal crypto.subtle mock for environments where it's not settable directly
try {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      subtle: {
        digest: async (_algorithm: string, data: BufferSource) => {
          const bytes = new Uint8Array(data as ArrayBuffer)
          // Simple non-cryptographic hash substitute for tests only
          let hash = 0
          for (let i = 0; i < bytes.length; i++) {
            hash = (hash * 31 + bytes[i]) >>> 0
          }
          const hex = hash.toString(16).padStart(8, '0')
          const encoder = new TextEncoder()
          return encoder.encode(hex).buffer
        }
      }
    }
  })
} catch {
  // ignore errors in test environment (crypto may already be defined)
}
