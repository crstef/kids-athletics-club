import { describe, it, expect, beforeEach } from 'vitest'
import type { Result } from '../lib/types'

describe('Data Validation', () => {
  describe('Result validation', () => {
    it('should validate positive time values', () => {
      const isValidTime = (value: number): boolean => value > 0 && value < 1000

      expect(isValidTime(12.5)).toBe(true)
      expect(isValidTime(0)).toBe(false)
      expect(isValidTime(-1)).toBe(false)
      expect(isValidTime(1001)).toBe(false)
    })

    it('should validate distance values', () => {
      const isValidDistance = (value: number): boolean => value > 0 && value < 100

      expect(isValidDistance(5.5)).toBe(true)
      expect(isValidDistance(0)).toBe(false)
      expect(isValidDistance(-1)).toBe(false)
      expect(isValidDistance(101)).toBe(false)
    })

    it('should validate date format', () => {
      const isValidDate = (dateString: string): boolean => {
        const date = new Date(dateString)
        return !isNaN(date.getTime())
      }

      expect(isValidDate('2024-01-15T10:30:00.000Z')).toBe(true)
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('invalid-date')).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should validate future dates are not allowed', () => {
      const isNotFutureDate = (dateString: string): boolean => {
        const date = new Date(dateString)
        return date <= new Date()
      }

      const pastDate = new Date('2020-01-01').toISOString()
      const futureDate = new Date('2030-01-01').toISOString()

      expect(isNotFutureDate(pastDate)).toBe(true)
      expect(isNotFutureDate(futureDate)).toBe(false)
    })
  })

  describe('Email validation', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Name validation', () => {
    const isValidName = (name: string): boolean => {
      return name.length >= 2 && name.length <= 50 && /^[a-zA-ZăâîșțĂÂÎȘȚ\s-]+$/.test(name)
    }

    it('should validate correct names', () => {
      expect(isValidName('Ion')).toBe(true)
      expect(isValidName('Maria-Elena')).toBe(true)
      expect(isValidName('Ștefan')).toBe(true)
      expect(isValidName('Ana Maria')).toBe(true)
    })

    it('should reject invalid names', () => {
      expect(isValidName('A')).toBe(false)
      expect(isValidName('')).toBe(false)
      expect(isValidName('Name123')).toBe(false)
      expect(isValidName('Name@#$')).toBe(false)
      expect(isValidName('a'.repeat(51))).toBe(false)
    })
  })

  describe('Age validation', () => {
    const isValidAge = (age: number): boolean => {
      return age >= 8 && age <= 18 && Number.isInteger(age)
    }

    it('should validate correct ages', () => {
      expect(isValidAge(8)).toBe(true)
      expect(isValidAge(14)).toBe(true)
      expect(isValidAge(18)).toBe(true)
    })

    it('should reject invalid ages', () => {
      expect(isValidAge(7)).toBe(false)
      expect(isValidAge(19)).toBe(false)
      expect(isValidAge(0)).toBe(false)
      expect(isValidAge(-1)).toBe(false)
      expect(isValidAge(12.5)).toBe(false)
    })
  })
})

describe('Edge Cases', () => {
  describe('Empty data handling', () => {
    it('should handle empty arrays', () => {
      const athletes: any[] = []
      expect(athletes.filter(a => a.coachId === 'coach-1')).toEqual([])
      expect(athletes.length).toBe(0)
    })

    it('should handle empty strings', () => {
      const searchQuery = ''
      const athletes = [{ firstName: 'Ion', lastName: 'Popescu' }]
      const filtered = athletes.filter(a =>
        a.firstName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      expect(filtered.length).toBe(1)
    })
  })

  describe('Null and undefined handling', () => {
    it('should handle null values', () => {
      const value: string | null = null
      expect(value ?? 'default').toBe('default')
    })

    it('should handle undefined values', () => {
      const value: string | undefined = undefined
      expect(value ?? 'default').toBe('default')
    })

    it('should handle optional fields', () => {
      const result: Result = {
        id: 'result-1',
        athleteId: 'athlete-1',
        eventType: '100m',
        value: 12.5,
        unit: 'seconds',
        date: new Date().toISOString()
      }

      expect(result.notes).toBeUndefined()
    })
  })

  describe('Array boundaries', () => {
    it('should handle accessing array elements safely', () => {
      const arr = [1, 2, 3]
      expect(arr[0]).toBe(1)
      expect(arr[arr.length - 1]).toBe(3)
      expect(arr[10]).toBeUndefined()
    })

    it('should handle array operations on empty arrays', () => {
      const arr: number[] = []
      expect(arr.find(x => x > 0)).toBeUndefined()
      expect(arr.filter(x => x > 0)).toEqual([])
      expect(arr.reduce((acc, x) => acc + x, 0)).toBe(0)
    })
  })

  describe('String operations', () => {
    it('should handle case-insensitive comparisons', () => {
      const str1 = 'Test'
      const str2 = 'test'
      expect(str1.toLowerCase()).toBe(str2.toLowerCase())
    })

    it('should handle trimming whitespace', () => {
      const str = '  test  '
      expect(str.trim()).toBe('test')
    })

    it('should handle special characters', () => {
      const name = 'Ștefan'
      expect(name.length).toBe(6)
      expect(name.toLowerCase()).toBe('ștefan')
    })
  })

  describe('Number operations', () => {
    it('should handle decimal precision', () => {
      const value1 = 12.5
      const value2 = 12.8
      const diff = value2 - value1
      expect(diff).toBeCloseTo(0.3, 10)
    })

    it('should handle zero values', () => {
      const value = 0
      expect(value === 0).toBe(true)
      expect(value > 0).toBe(false)
    })

    it('should handle negative values', () => {
      const value = -1
      expect(value < 0).toBe(true)
    })
  })
})

describe('Date Operations', () => {
  describe('Date comparisons', () => {
    it('should compare dates correctly', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-02')

      expect(date1.getTime() < date2.getTime()).toBe(true)
      expect(date2.getTime() > date1.getTime()).toBe(true)
    })

    it('should sort dates', () => {
      const dates = [
        new Date('2024-03-01'),
        new Date('2024-01-01'),
        new Date('2024-02-01')
      ]

      const sorted = dates.sort((a, b) => a.getTime() - b.getTime())

      expect(sorted[0].getMonth()).toBe(0)
      expect(sorted[1].getMonth()).toBe(1)
      expect(sorted[2].getMonth()).toBe(2)
    })
  })

  describe('Date formatting', () => {
    it('should format dates as ISO strings', () => {
      const date = new Date('2024-01-15T10:30:00.000Z')
      const isoString = date.toISOString()

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should parse ISO date strings', () => {
      const isoString = '2024-01-15T10:30:00.000Z'
      const date = new Date(isoString)

      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })
  })

  describe('Time calculations', () => {
    it('should calculate time differences', () => {
      const date1 = new Date('2024-01-01T00:00:00.000Z')
      const date2 = new Date('2024-01-02T00:00:00.000Z')

      const diffMs = date2.getTime() - date1.getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      expect(diffDays).toBe(1)
    })

    it('should add days to date', () => {
      const date = new Date('2024-01-01')
      const newDate = new Date(date)
      newDate.setDate(newDate.getDate() + 7)

      expect(newDate.getDate()).toBe(8)
    })
  })
})
