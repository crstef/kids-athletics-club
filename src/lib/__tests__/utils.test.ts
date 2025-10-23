import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (className merge utility)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const cond = () => false
      const result = cn('foo', cond() && 'bar', 'baz')
      expect(result).toBe('foo baz')
    })

    it('should handle undefined and null', () => {
      const result = cn('foo', undefined, null, 'bar')
      expect(result).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      const result = cn('px-4 py-2', 'px-6')
      expect(result).toContain('px-6')
      expect(result).not.toContain('px-4')
      expect(result).toContain('py-2')
    })

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('should handle objects', () => {
      const result = cn({ foo: true, bar: false, baz: true })
      expect(result).toContain('foo')
      expect(result).not.toContain('bar')
      expect(result).toContain('baz')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle complex tailwind merges', () => {
      const result = cn(
        'bg-red-500 text-white',
        'bg-blue-500',
        'hover:bg-red-600'
      )
      expect(result).toContain('bg-blue-500')
      expect(result).not.toContain('bg-red-500')
      expect(result).toContain('text-white')
      expect(result).toContain('hover:bg-red-600')
    })

    it('should handle responsive classes', () => {
      const result = cn(
        'text-sm md:text-base',
        'md:text-lg'
      )
      expect(result).toContain('text-sm')
      expect(result).toContain('md:text-lg')
      expect(result).not.toContain('md:text-base')
    })
  })
})
