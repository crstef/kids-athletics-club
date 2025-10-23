import { describe, it, expect, beforeEach } from 'vitest'
import type { Athlete, Result, User, AccessRequest, Message } from '../lib/types'

describe('Integration: Athlete Management Flow', () => {
  let athletes: Athlete[] = []
  let results: Result[] = []
  let _users: User[] = []

  beforeEach(() => {
    athletes = []
    results = []
  _users = [
      {
        id: 'coach-1',
        email: 'coach@test.com',
        password: 'hash',
        firstName: 'Coach',
        lastName: 'Test',
        role: 'coach',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
  })

  it('should complete full athlete lifecycle', () => {
    const newAthlete: Athlete = {
      id: 'athlete-1',
      firstName: 'Ion',
      lastName: 'Popescu',
      age: 14,
      category: 'U16',
      gender: 'M',
      dateOfBirth: '2010-01-01',
      dateJoined: new Date().toISOString(),
      coachId: 'coach-1'
    }
    athletes.push(newAthlete)

    expect(athletes.length).toBe(1)
    expect(athletes[0].firstName).toBe('Ion')

    const newResult: Result = {
      id: 'result-1',
      athleteId: 'athlete-1',
      eventType: '100m',
      value: 12.5,
      unit: 'seconds',
      date: new Date().toISOString()
    }
    results.push(newResult)

    const athleteResults = results.filter(r => r.athleteId === 'athlete-1')
    expect(athleteResults.length).toBe(1)
    expect(athleteResults[0].value).toBe(12.5)

    const updatedAthlete = { ...athletes[0], age: 15 }
    athletes[0] = updatedAthlete
    expect(athletes[0].age).toBe(15)

    athletes = athletes.filter(a => a.id !== 'athlete-1')
    results = results.filter(r => r.athleteId !== 'athlete-1')

    expect(athletes.length).toBe(0)
    expect(results.length).toBe(0)
  })

  it('should manage multiple athletes per coach', () => {
    const athlete1: Athlete = {
      id: 'athlete-1',
      firstName: 'Ion',
      lastName: 'Popescu',
      age: 14,
      category: 'U16',
      gender: 'M',
      dateOfBirth: '2010-01-01',
      dateJoined: new Date().toISOString(),
      coachId: 'coach-1'
    }

    const athlete2: Athlete = {
      id: 'athlete-2',
      firstName: 'Maria',
      lastName: 'Ionescu',
      age: 12,
      category: 'U14',
      gender: 'F',
      dateOfBirth: '2012-05-10',
      dateJoined: new Date().toISOString(),
      coachId: 'coach-1'
    }

    athletes.push(athlete1, athlete2)

    const coachAthletes = athletes.filter(a => a.coachId === 'coach-1')
    expect(coachAthletes.length).toBe(2)

    results.push({
      id: 'result-1',
      athleteId: 'athlete-1',
      eventType: '100m',
      value: 12.5,
      unit: 'seconds',
      date: new Date().toISOString()
    })

    results.push({
      id: 'result-2',
      athleteId: 'athlete-1',
      eventType: '200m',
      value: 26.3,
      unit: 'seconds',
      date: new Date().toISOString()
    })

    results.push({
      id: 'result-3',
      athleteId: 'athlete-2',
      eventType: '60m',
      value: 8.7,
      unit: 'seconds',
      date: new Date().toISOString()
    })

    const athlete1Results = results.filter(r => r.athleteId === 'athlete-1')
    const athlete2Results = results.filter(r => r.athleteId === 'athlete-2')

    expect(athlete1Results.length).toBe(2)
    expect(athlete2Results.length).toBe(1)
  })

  it('should track performance improvements', () => {
    const athlete: Athlete = {
      id: 'athlete-1',
      firstName: 'Ion',
      lastName: 'Popescu',
      age: 14,
      category: 'U16',
      gender: 'M',
      dateOfBirth: '2010-01-01',
      dateJoined: new Date().toISOString(),
      coachId: 'coach-1'
    }
    athletes.push(athlete)

    const result1: Result = {
      id: 'result-1',
      athleteId: 'athlete-1',
      eventType: '100m',
      value: 13.2,
      unit: 'seconds',
      date: new Date('2024-01-01').toISOString()
    }

    const result2: Result = {
      id: 'result-2',
      athleteId: 'athlete-1',
      eventType: '100m',
      value: 12.8,
      unit: 'seconds',
      date: new Date('2024-02-01').toISOString()
    }

    const result3: Result = {
      id: 'result-3',
      athleteId: 'athlete-1',
      eventType: '100m',
      value: 12.5,
      unit: 'seconds',
      date: new Date('2024-03-01').toISOString()
    }

    results.push(result1, result2, result3)

    const athleteResults = results
      .filter(r => r.athleteId === 'athlete-1' && r.eventType === '100m')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    expect(athleteResults.length).toBe(3)
    expect(athleteResults[0].value).toBeGreaterThan(athleteResults[1].value)
    expect(athleteResults[1].value).toBeGreaterThan(athleteResults[2].value)

  const improvement = athleteResults[0].value - athleteResults[2].value
  expect(improvement).toBeCloseTo(0.7, 2)
  })
})

describe('Integration: Access Request Flow', () => {
  let _users: User[] = []
  let _athletes: Athlete[] = []
  let accessRequests: AccessRequest[] = []

  beforeEach(() => {
  _users = [
      {
        id: 'coach-1',
        email: 'coach@test.com',
        password: 'hash',
        firstName: 'Coach',
        lastName: 'Test',
        role: 'coach',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'parent-1',
        email: 'parent@test.com',
        password: 'hash',
        firstName: 'Parent',
        lastName: 'Test',
        role: 'parent',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]

    _athletes = [
      {
        id: 'athlete-1',
        firstName: 'Ion',
        lastName: 'Popescu',
        age: 14,
        category: 'U16',
        gender: 'M',
        dateOfBirth: '2010-01-01',
        dateJoined: new Date().toISOString(),
        coachId: 'coach-1'
      }
    ]

    accessRequests = []
  })

  it('should complete access request workflow', () => {
    const newRequest: AccessRequest = {
      id: 'request-1',
      parentId: 'parent-1',
      athleteId: 'athlete-1',
      coachId: 'coach-1',
      status: 'pending',
      requestDate: new Date().toISOString()
    }
    accessRequests.push(newRequest)

    const pendingRequests = accessRequests.filter(r => r.status === 'pending')
    expect(pendingRequests.length).toBe(1)

    accessRequests = accessRequests.map(r =>
      r.id === 'request-1'
        ? { ...r, status: 'approved' as const, responseDate: new Date().toISOString() }
        : r
    )

    const approvedRequests = accessRequests.filter(r => r.status === 'approved')
    expect(approvedRequests.length).toBe(1)
    expect(approvedRequests[0].responseDate).toBeDefined()
  })

  it('should reject access requests', () => {
    const newRequest: AccessRequest = {
      id: 'request-1',
      parentId: 'parent-1',
      athleteId: 'athlete-1',
      coachId: 'coach-1',
      status: 'pending',
      requestDate: new Date().toISOString()
    }
    accessRequests.push(newRequest)

    accessRequests = accessRequests.map(r =>
      r.id === 'request-1'
        ? { 
            ...r, 
            status: 'rejected' as const, 
            responseDate: new Date().toISOString(),
            message: 'Not authorized'
          }
        : r
    )

    const rejectedRequests = accessRequests.filter(r => r.status === 'rejected')
    expect(rejectedRequests.length).toBe(1)
    expect(rejectedRequests[0].message).toBe('Not authorized')
  })

  it('should filter requests by coach', () => {
    accessRequests.push(
      {
        id: 'request-1',
        parentId: 'parent-1',
        athleteId: 'athlete-1',
        coachId: 'coach-1',
        status: 'pending',
        requestDate: new Date().toISOString()
      },
      {
        id: 'request-2',
        parentId: 'parent-1',
        athleteId: 'athlete-2',
        coachId: 'coach-2',
        status: 'pending',
        requestDate: new Date().toISOString()
      }
    )

    const coach1Requests = accessRequests.filter(r => r.coachId === 'coach-1')
    expect(coach1Requests.length).toBe(1)
    expect(coach1Requests[0].id).toBe('request-1')
  })
})

describe('Integration: Messaging Flow', () => {
  let messages: Message[] = []
  let _users: User[] = []

  beforeEach(() => {
  _users = [
      {
        id: 'coach-1',
        email: 'coach@test.com',
        password: 'hash',
        firstName: 'Coach',
        lastName: 'Test',
        role: 'coach',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'parent-1',
        email: 'parent@test.com',
        password: 'hash',
        firstName: 'Parent',
        lastName: 'Test',
        role: 'parent',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]
    messages = []
  })

  it('should send and receive messages', () => {
    const newMessage: Message = {
      id: 'message-1',
      fromUserId: 'parent-1',
      toUserId: 'coach-1',
      athleteId: 'athlete-1',
      content: 'Ce progres face copilul meu?',
      timestamp: new Date().toISOString(),
      read: false
    }
    messages.push(newMessage)

    const coachMessages = messages.filter(m => m.toUserId === 'coach-1')
    expect(coachMessages.length).toBe(1)
    expect(coachMessages[0].read).toBe(false)

    messages = messages.map(m =>
      m.id === 'message-1' ? { ...m, read: true } : m
    )

    const unreadMessages = messages.filter(m => m.toUserId === 'coach-1' && !m.read)
    expect(unreadMessages.length).toBe(0)
  })

  it('should handle conversation threads', () => {
    messages.push(
      {
        id: 'message-1',
        fromUserId: 'parent-1',
        toUserId: 'coach-1',
        athleteId: 'athlete-1',
        content: 'Întrebare 1',
        timestamp: new Date('2024-01-01T10:00:00').toISOString(),
        read: true
      },
      {
        id: 'message-2',
        fromUserId: 'coach-1',
        toUserId: 'parent-1',
        athleteId: 'athlete-1',
        content: 'Răspuns 1',
        timestamp: new Date('2024-01-01T11:00:00').toISOString(),
        read: true
      },
      {
        id: 'message-3',
        fromUserId: 'parent-1',
        toUserId: 'coach-1',
        athleteId: 'athlete-1',
        content: 'Întrebare 2',
        timestamp: new Date('2024-01-01T12:00:00').toISOString(),
        read: false
      }
    )

    const conversation = messages
      .filter(m => 
        (m.fromUserId === 'parent-1' && m.toUserId === 'coach-1') ||
        (m.fromUserId === 'coach-1' && m.toUserId === 'parent-1')
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    expect(conversation.length).toBe(3)
    expect(conversation[0].content).toBe('Întrebare 1')
    expect(conversation[1].content).toBe('Răspuns 1')
    expect(conversation[2].content).toBe('Întrebare 2')
  })

  it('should count unread messages per user', () => {
    messages.push(
      {
        id: 'message-1',
        fromUserId: 'parent-1',
        toUserId: 'coach-1',
        content: 'Message 1',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'message-2',
        fromUserId: 'parent-1',
        toUserId: 'coach-1',
        content: 'Message 2',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'message-3',
        fromUserId: 'coach-1',
        toUserId: 'parent-1',
        content: 'Message 3',
        timestamp: new Date().toISOString(),
        read: true
      }
    )

    const unreadForCoach = messages.filter(m => m.toUserId === 'coach-1' && !m.read)
    expect(unreadForCoach.length).toBe(2)

    const unreadForParent = messages.filter(m => m.toUserId === 'parent-1' && !m.read)
    expect(unreadForParent.length).toBe(0)
  })
})
