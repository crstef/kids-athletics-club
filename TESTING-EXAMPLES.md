# Exemple de Teste pentru Componente React

Acest document oferă exemple practice pentru a scrie teste pentru componente noi în aplicație.

## 📝 Template de Bază pentru Test Component

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('should handle user interaction', async () => {
    render(<MyComponent />)
    const button = screen.getByRole('button', { name: /click me/i })
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Clicked!')).toBeInTheDocument()
    })
  })
})
```

## 🧪 Exemplu: Testare AthleteCard

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AthleteCard } from '../AthleteCard'
import type { Athlete } from '@/lib/types'

describe('AthleteCard', () => {
  const mockAthlete: Athlete = {
    id: 'athlete-1',
    firstName: 'Ion',
    lastName: 'Popescu',
    age: 14,
    category: 'U16',
    dateJoined: new Date('2024-01-01').toISOString(),
    coachId: 'coach-1'
  }

  const mockHandlers = {
    onViewDetails: vi.fn(),
    onViewChart: vi.fn(),
    onDelete: vi.fn()
  }

  it('should render athlete information', () => {
    render(
      <AthleteCard
        athlete={mockAthlete}
        resultsCount={5}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Ion Popescu')).toBeInTheDocument()
    expect(screen.getByText('14 ani')).toBeInTheDocument()
    expect(screen.getByText('U16')).toBeInTheDocument()
  })

  it('should display results count badge', () => {
    render(
      <AthleteCard
        athlete={mockAthlete}
        resultsCount={5}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should call onViewDetails when details button is clicked', () => {
    render(
      <AthleteCard
        athlete={mockAthlete}
        resultsCount={5}
        {...mockHandlers}
      />
    )

    const detailsButton = screen.getByRole('button', { name: /vezi detalii/i })
    fireEvent.click(detailsButton)

    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockAthlete)
    expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(1)
  })

  it('should call onViewChart when chart button is clicked', () => {
    render(
      <AthleteCard
        athlete={mockAthlete}
        resultsCount={5}
        {...mockHandlers}
      />
    )

    const chartButton = screen.getByRole('button', { name: /grafic/i })
    fireEvent.click(chartButton)

    expect(mockHandlers.onViewChart).toHaveBeenCalledWith(mockAthlete)
  })

  it('should not render delete button when onDelete is not provided', () => {
    render(
      <AthleteCard
        athlete={mockAthlete}
        resultsCount={5}
        onViewDetails={mockHandlers.onViewDetails}
        onViewChart={mockHandlers.onViewChart}
      />
    )

    const deleteButton = screen.queryByRole('button', { name: /șterge/i })
    expect(deleteButton).not.toBeInTheDocument()
  })
})
```

## 🔄 Exemplu: Testare cu Context (useAuth)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AuthProvider } from '@/lib/auth-context'
import { useKV } from '@github/spark/hooks'
import { MyProtectedComponent } from '../MyProtectedComponent'

vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn()
}))

describe('MyProtectedComponent with Auth', () => {
  it('should show content for authenticated user', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      role: 'coach',
      isActive: true
    }

    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return ['user-1', vi.fn(), vi.fn()]
      if (key === 'users') return [[mockUser], vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <MyProtectedComponent />
      </AuthProvider>
    )

    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  it('should show login prompt for unauthenticated user', () => {
    vi.mocked(useKV).mockImplementation((key: string) => {
      if (key === 'current-user-id') return [null, vi.fn(), vi.fn()]
      if (key === 'users') return [[], vi.fn(), vi.fn()]
      return [null, vi.fn(), vi.fn()]
    })

    render(
      <AuthProvider>
        <MyProtectedComponent />
      </AuthProvider>
    )

    expect(screen.getByText(/login/i)).toBeInTheDocument()
  })
})
```

## 📋 Exemplu: Testare Formulare

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { AddAthleteDialog } from '../AddAthleteDialog'

describe('AddAthleteDialog', () => {
  const mockOnAdd = vi.fn()
  const mockCoaches = [
    { id: 'coach-1', firstName: 'Coach', lastName: 'One', role: 'coach' }
  ]

  it('should validate required fields', async () => {
    render(
      <AddAthleteDialog 
        onAdd={mockOnAdd} 
        coaches={mockCoaches} 
      />
    )

    const submitButton = screen.getByRole('button', { name: /adaugă/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/câmp obligatoriu/i)).toBeInTheDocument()
    })

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()

    render(
      <AddAthleteDialog 
        onAdd={mockOnAdd} 
        coaches={mockCoaches} 
      />
    )

    await user.type(screen.getByLabelText(/prenume/i), 'Ion')
    await user.type(screen.getByLabelText(/nume/i), 'Popescu')
    await user.type(screen.getByLabelText(/vârstă/i), '14')
    
    const categorySelect = screen.getByLabelText(/categorie/i)
    await user.click(categorySelect)
    await user.click(screen.getByText('U16'))

    const submitButton = screen.getByRole('button', { name: /adaugă/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Ion',
          lastName: 'Popescu',
          age: 14,
          category: 'U16'
        })
      )
    })
  })

  it('should close dialog on cancel', async () => {
    const user = userEvent.setup()

    render(
      <AddAthleteDialog 
        onAdd={mockOnAdd} 
        coaches={mockCoaches} 
      />
    )

    const cancelButton = screen.getByRole('button', { name: /anulează/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
```

## 🎨 Exemplu: Testare cu Props Condiționale

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatWidget } from '../StatWidget'

describe('StatWidget', () => {
  it('should render with default variant', () => {
    render(<StatWidget title="Total" value={10} />)
    
    const widget = screen.getByText('Total').parentElement
    expect(widget).toHaveClass('bg-card')
  })

  it('should render with primary variant', () => {
    render(<StatWidget title="Active" value={5} variant="primary" />)
    
    const widget = screen.getByText('Active').parentElement
    expect(widget).toHaveClass('bg-primary')
  })

  it('should render with icon when provided', () => {
    render(
      <StatWidget 
        title="Users" 
        value={10} 
        icon={<span data-testid="icon">👤</span>}
      />
    )
    
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('should not render icon when not provided', () => {
    render(<StatWidget title="Users" value={10} />)
    
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  })

  it('should format large numbers', () => {
    render(<StatWidget title="Total" value={1234567} />)
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})
```

## 🔍 Exemplu: Testare cu Queries Complexe

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AthleteDashboard } from '../AthleteDashboard'

describe('AthleteDashboard', () => {
  const mockData = {
    athlete: {
      id: 'athlete-1',
      firstName: 'Ion',
      lastName: 'Popescu',
      age: 14,
      category: 'U16'
    },
    results: [
      { id: 'r1', athleteId: 'athlete-1', eventType: '100m', value: 12.5, unit: 'seconds', date: '2024-01-01' },
      { id: 'r2', athleteId: 'athlete-1', eventType: '100m', value: 12.3, unit: 'seconds', date: '2024-02-01' }
    ]
  }

  it('should display athlete stats in correct sections', () => {
    render(<AthleteDashboard {...mockData} />)

    const statsSection = screen.getByTestId('athlete-stats')
    const { getByText } = within(statsSection)

    expect(getByText('Ion Popescu')).toBeInTheDocument()
    expect(getByText('14 ani')).toBeInTheDocument()
    expect(getByText('U16')).toBeInTheDocument()
  })

  it('should display performance chart with all results', () => {
    render(<AthleteDashboard {...mockData} />)

    const chartSection = screen.getByTestId('performance-chart')
    const dataPoints = within(chartSection).getAllByTestId('data-point')

    expect(dataPoints).toHaveLength(2)
  })

  it('should show empty state when no results', () => {
    render(<AthleteDashboard athlete={mockData.athlete} results={[]} />)

    expect(screen.getByText(/niciun rezultat/i)).toBeInTheDocument()
  })
})
```

## ⚡ Exemplu: Testare Async Operations

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ResultsList } from '../ResultsList'

describe('ResultsList with Async Data', () => {
  it('should show loading state', () => {
    render(<ResultsList loading={true} results={[]} />)
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display results after loading', async () => {
    const { rerender } = render(<ResultsList loading={true} results={[]} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

    const mockResults = [
      { id: 'r1', athleteId: 'a1', eventType: '100m', value: 12.5, unit: 'seconds', date: '2024-01-01' }
    ]

    rerender(<ResultsList loading={false} results={mockResults} />)

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      expect(screen.getByText('100m')).toBeInTheDocument()
      expect(screen.getByText('12.5s')).toBeInTheDocument()
    })
  })

  it('should handle error state', async () => {
    const mockError = new Error('Failed to load')
    
    render(<ResultsList error={mockError} results={[]} />)

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
  })
})
```

## 🎭 Common Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)
```typescript
it('should update athlete age', () => {
  // Arrange
  const athlete = { id: '1', age: 14 }
  
  // Act
  const updated = { ...athlete, age: 15 }
  
  // Assert
  expect(updated.age).toBe(15)
})
```

### Pattern 2: Given-When-Then
```typescript
it('should approve access request', () => {
  // Given an access request exists
  const request = { id: 'r1', status: 'pending' }
  
  // When the coach approves it
  const approved = { ...request, status: 'approved' }
  
  // Then the status should be approved
  expect(approved.status).toBe('approved')
})
```

### Pattern 3: Testing Callbacks
```typescript
it('should call callback with correct arguments', () => {
  const callback = vi.fn()
  
  render(<Button onClick={callback}>Click</Button>)
  
  fireEvent.click(screen.getByText('Click'))
  
  expect(callback).toHaveBeenCalledTimes(1)
})
```

## 🛠️ Useful Testing Utilities

### Custom Render with Providers
```typescript
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/lib/auth-context'

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Mock Data Factory
```typescript
export const createMockAthlete = (overrides?: Partial<Athlete>): Athlete => ({
  id: 'athlete-1',
  firstName: 'Ion',
  lastName: 'Popescu',
  age: 14,
  category: 'U16',
  dateJoined: new Date().toISOString(),
  coachId: 'coach-1',
  ...overrides
})

// Usage
const athlete = createMockAthlete({ age: 15, firstName: 'Maria' })
```

## 📚 Resources

- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Vitest API](https://vitest.dev/api/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
