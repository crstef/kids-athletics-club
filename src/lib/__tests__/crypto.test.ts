import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../crypto'

describe('Crypto utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'test123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should produce consistent hashes for the same password', async () => {
      const password = 'test123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'test123'
      const password2 = 'test456'
      const hash1 = await hashPassword(password1)
      const hash2 = await hashPassword(password2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', async () => {
      const password = ''
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })

    it('should handle special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should handle unicode characters', async () => {
      const password = 'păsărică🦅'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'test123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'test123'
      const wrongPassword = 'test456'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })

    it('should be case sensitive', async () => {
      const password = 'Test123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('test123', hash)
      
      expect(isValid).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const password = ''
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject empty password against non-empty hash', async () => {
      const password = 'test123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword('', hash)
      
      expect(isValid).toBe(false)
    })
  })
})
