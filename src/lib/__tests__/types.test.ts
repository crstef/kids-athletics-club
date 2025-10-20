import { describe, it, expect } from 'vitest'
import type { Athlete, Result, AgeCategory } from '../types'

describe('Type validations', () => {
  describe('Athlete', () => {
    it('should create valid athlete object', () => {
      const athlete: Athlete = {
        id: 'athlete-1',
        firstName: 'Ion',
        lastName: 'Popescu',
        age: 14,
        category: 'U16',
        dateJoined: new Date().toISOString(),
        coachId: 'coach-1'
      }

      expect(athlete.id).toBe('athlete-1')
      expect(athlete.firstName).toBe('Ion')
      expect(athlete.age).toBe(14)
      expect(athlete.category).toBe('U16')
    })

    it('should validate age categories', () => {
      const categories: AgeCategory[] = ['U10', 'U12', 'U14', 'U16', 'U18']
      
      categories.forEach(category => {
        const athlete: Athlete = {
          id: 'test',
          firstName: 'Test',
          lastName: 'Athlete',
          age: 10,
          category,
          dateJoined: new Date().toISOString()
        }
        expect(athlete.category).toBe(category)
      })
    })
  })

  describe('Result', () => {
    it('should create valid result with seconds unit', () => {
      const result: Result = {
        id: 'result-1',
        athleteId: 'athlete-1',
        eventType: '100m',
        value: 12.5,
        unit: 'seconds',
        date: new Date().toISOString()
      }

      expect(result.value).toBe(12.5)
      expect(result.unit).toBe('seconds')
      expect(result.eventType).toBe('100m')
    })

    it('should create valid result with meters unit', () => {
      const result: Result = {
        id: 'result-1',
        athleteId: 'athlete-1',
        eventType: 'Long Jump',
        value: 5.25,
        unit: 'meters',
        date: new Date().toISOString(),
        notes: 'Personal best'
      }

      expect(result.value).toBe(5.25)
      expect(result.unit).toBe('meters')
      expect(result.notes).toBe('Personal best')
    })
  })

  describe('Date handling', () => {
    it('should use ISO date strings', () => {
      const now = new Date()
      const isoString = now.toISOString()

      expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should parse ISO date strings', () => {
      const isoString = '2024-01-15T10:30:00.000Z'
      const date = new Date(isoString)

      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(15)
    })
  })
})
