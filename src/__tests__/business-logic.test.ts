import { describe, it, expect } from 'vitest'

describe('Business Logic: Athlete Age Categories', () => {
  const calculateAgeCategory = (age: number): string => {
    if (age >= 8 && age <= 9) return 'U10'
    if (age >= 10 && age <= 11) return 'U12'
    if (age >= 12 && age <= 13) return 'U14'
    if (age >= 14 && age <= 15) return 'U16'
    if (age >= 16 && age <= 17) return 'U18'
    return 'Unknown'
  }

  it('should assign U10 category correctly', () => {
    expect(calculateAgeCategory(8)).toBe('U10')
    expect(calculateAgeCategory(9)).toBe('U10')
  })

  it('should assign U12 category correctly', () => {
    expect(calculateAgeCategory(10)).toBe('U12')
    expect(calculateAgeCategory(11)).toBe('U12')
  })

  it('should assign U14 category correctly', () => {
    expect(calculateAgeCategory(12)).toBe('U14')
    expect(calculateAgeCategory(13)).toBe('U14')
  })

  it('should assign U16 category correctly', () => {
    expect(calculateAgeCategory(14)).toBe('U16')
    expect(calculateAgeCategory(15)).toBe('U16')
  })

  it('should assign U18 category correctly', () => {
    expect(calculateAgeCategory(16)).toBe('U18')
    expect(calculateAgeCategory(17)).toBe('U18')
  })

  it('should handle edge cases', () => {
    expect(calculateAgeCategory(7)).toBe('Unknown')
    expect(calculateAgeCategory(18)).toBe('Unknown')
    expect(calculateAgeCategory(0)).toBe('Unknown')
  })
})

describe('Business Logic: Performance Comparison', () => {
  const compareResults = (value1: number, value2: number, unit: 'seconds' | 'meters'): string => {
    if (unit === 'seconds') {
      if (value1 < value2) return 'improved'
      if (value1 > value2) return 'declined'
      return 'same'
    } else {
      if (value1 > value2) return 'improved'
      if (value1 < value2) return 'declined'
      return 'same'
    }
  }

  it('should detect improvement in time-based events', () => {
    expect(compareResults(12.5, 13.2, 'seconds')).toBe('improved')
    expect(compareResults(13.2, 12.5, 'seconds')).toBe('declined')
    expect(compareResults(12.5, 12.5, 'seconds')).toBe('same')
  })

  it('should detect improvement in distance-based events', () => {
    expect(compareResults(5.5, 5.2, 'meters')).toBe('improved')
    expect(compareResults(5.2, 5.5, 'meters')).toBe('declined')
    expect(compareResults(5.5, 5.5, 'meters')).toBe('same')
  })
})

describe('Business Logic: Result Statistics', () => {
  interface Result {
    value: number
    date: string
  }

  const calculateAverage = (results: Result[]): number => {
    if (results.length === 0) return 0
    const sum = results.reduce((acc, r) => acc + r.value, 0)
    return sum / results.length
  }

  const calculateBestResult = (results: Result[], unit: 'seconds' | 'meters'): number | null => {
    if (results.length === 0) return null
    if (unit === 'seconds') {
      return Math.min(...results.map(r => r.value))
    } else {
      return Math.max(...results.map(r => r.value))
    }
  }

  const calculateImprovementRate = (results: Result[]): number => {
    if (results.length < 2) return 0
    const sorted = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const first = sorted[0].value
    const last = sorted[sorted.length - 1].value
    return ((first - last) / first) * 100
  }

  it('should calculate average correctly', () => {
    const results = [
      { value: 12.5, date: '2024-01-01' },
      { value: 13.0, date: '2024-01-02' },
      { value: 12.8, date: '2024-01-03' }
    ]
    expect(calculateAverage(results)).toBeCloseTo(12.77, 2)
  })

  it('should handle empty results for average', () => {
    expect(calculateAverage([])).toBe(0)
  })

  it('should calculate best time result', () => {
    const results = [
      { value: 12.5, date: '2024-01-01' },
      { value: 13.0, date: '2024-01-02' },
      { value: 12.2, date: '2024-01-03' }
    ]
    expect(calculateBestResult(results, 'seconds')).toBe(12.2)
  })

  it('should calculate best distance result', () => {
    const results = [
      { value: 5.2, date: '2024-01-01' },
      { value: 5.5, date: '2024-01-02' },
      { value: 5.3, date: '2024-01-03' }
    ]
    expect(calculateBestResult(results, 'meters')).toBe(5.5)
  })

  it('should handle empty results for best result', () => {
    expect(calculateBestResult([], 'seconds')).toBeNull()
  })

  it('should calculate improvement rate', () => {
    const results = [
      { value: 13.0, date: '2024-01-01' },
      { value: 12.5, date: '2024-02-01' },
      { value: 12.0, date: '2024-03-01' }
    ]
    const rate = calculateImprovementRate(results)
    expect(rate).toBeCloseTo(7.69, 2)
  })

  it('should return 0 improvement rate for single result', () => {
    const results = [{ value: 12.5, date: '2024-01-01' }]
    expect(calculateImprovementRate(results)).toBe(0)
  })
})

describe('Business Logic: Access Control', () => {
  const hasAccessToAthlete = (
    requestingUserId: string,
    athleteId: string,
    approvedRequests: Array<{ parentId: string; athleteId: string; status: string }>
  ): boolean => {
    return approvedRequests.some(
      req => req.parentId === requestingUserId && 
             req.athleteId === athleteId && 
             req.status === 'approved'
    )
  }

  it('should grant access when approved', () => {
    const approvedRequests = [
      { parentId: 'parent-1', athleteId: 'athlete-1', status: 'approved' }
    ]
    expect(hasAccessToAthlete('parent-1', 'athlete-1', approvedRequests)).toBe(true)
  })

  it('should deny access when not approved', () => {
    const approvedRequests = [
      { parentId: 'parent-1', athleteId: 'athlete-1', status: 'pending' }
    ]
    expect(hasAccessToAthlete('parent-1', 'athlete-1', approvedRequests)).toBe(false)
  })

  it('should deny access for different athlete', () => {
    const approvedRequests = [
      { parentId: 'parent-1', athleteId: 'athlete-1', status: 'approved' }
    ]
    expect(hasAccessToAthlete('parent-1', 'athlete-2', approvedRequests)).toBe(false)
  })

  it('should deny access for different parent', () => {
    const approvedRequests = [
      { parentId: 'parent-1', athleteId: 'athlete-1', status: 'approved' }
    ]
    expect(hasAccessToAthlete('parent-2', 'athlete-1', approvedRequests)).toBe(false)
  })
})

describe('Business Logic: Data Filtering', () => {
  interface Athlete {
    id: string
    firstName: string
    lastName: string
    age: number
    category: string
    coachId: string
  }

  const filterAthletesByCoach = (athletes: Athlete[], coachId: string): Athlete[] => {
    return athletes.filter(a => a.coachId === coachId)
  }

  const filterAthletesByCategory = (athletes: Athlete[], category: string): Athlete[] => {
    return athletes.filter(a => a.category === category)
  }

  const searchAthletes = (athletes: Athlete[], query: string): Athlete[] => {
    const lowerQuery = query.toLowerCase()
    return athletes.filter(a =>
      a.firstName.toLowerCase().includes(lowerQuery) ||
      a.lastName.toLowerCase().includes(lowerQuery)
    )
  }

  const athletes: Athlete[] = [
    { id: '1', firstName: 'Ion', lastName: 'Popescu', age: 14, category: 'U16', coachId: 'coach-1' },
    { id: '2', firstName: 'Maria', lastName: 'Ionescu', age: 12, category: 'U14', coachId: 'coach-1' },
    { id: '3', firstName: 'Andrei', lastName: 'Popescu', age: 14, category: 'U16', coachId: 'coach-2' }
  ]

  it('should filter athletes by coach', () => {
    const filtered = filterAthletesByCoach(athletes, 'coach-1')
    expect(filtered.length).toBe(2)
    expect(filtered.every(a => a.coachId === 'coach-1')).toBe(true)
  })

  it('should filter athletes by category', () => {
    const filtered = filterAthletesByCategory(athletes, 'U16')
    expect(filtered.length).toBe(2)
    expect(filtered.every(a => a.category === 'U16')).toBe(true)
  })

  it('should search athletes by name', () => {
    const filtered = searchAthletes(athletes, 'popescu')
    expect(filtered.length).toBe(2)
    expect(filtered.every(a => a.lastName.toLowerCase().includes('popescu'))).toBe(true)
  })

  it('should search athletes by first name', () => {
    const filtered = searchAthletes(athletes, 'ion')
    expect(filtered.length).toBe(2)
  })

  it('should return empty array for no matches', () => {
    const filtered = searchAthletes(athletes, 'xyz')
    expect(filtered.length).toBe(0)
  })

  it('should be case insensitive', () => {
    const filtered1 = searchAthletes(athletes, 'MARIA')
    const filtered2 = searchAthletes(athletes, 'maria')
    expect(filtered1).toEqual(filtered2)
  })
})
