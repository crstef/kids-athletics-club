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

global.crypto = {
  subtle: {
    digest: async (algorithm: string, data: BufferSource) => {
      const hashArray = Array.from(new Uint8Array(data as ArrayBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      const encoder = new TextEncoder()
      return encoder.encode(hashHex).buffer
    }
  }
} as any
