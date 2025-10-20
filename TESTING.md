# Testing Guide - Club Atletism Application

Acest document descrie strategia de testare și cum să rulezi testele pentru aplicația de management al clubului de atletism.

## 📋 Cuprins

- [Tipuri de Teste](#tipuri-de-teste)
- [Setup și Rulare](#setup-și-rulare)
- [Structura Testelor](#structura-testelor)
- [Coverage](#coverage)
- [Best Practices](#best-practices)

## 🧪 Tipuri de Teste

### 1. Unit Tests
Testează funcționalități individuale izolat.

**Locație**: `src/lib/__tests__/`

**Acoperire**:
- ✅ Funcții de criptare (`crypto.test.ts`)
- ✅ Sistem de permisiuni (`permissions.test.ts`)
- ✅ Utilitare generale (`utils.test.ts`)
- ✅ Context de autentificare (`auth-context.test.tsx`)
- ✅ Validări de tipuri (`types.test.ts`)

### 2. Integration Tests
Testează interacțiunea între multiple componente.

**Locație**: `src/__tests__/integration.test.ts`

**Scenarii testate**:
- ✅ Fluxul complet al managementului atletilor (creare, editare, rezultate, ștergere)
- ✅ Workflow-ul cererilor de acces (părinte → antrenor → aprobare)
- ✅ Sistemul de mesagerie (trimitere, primire, marcare ca citit)
- ✅ Gestionarea multiplilor atleți pe antrenor

### 3. Business Logic Tests
Testează logica de business specifică aplicației.

**Locație**: `src/__tests__/business-logic.test.ts`

**Acoperire**:
- ✅ Calculul categoriilor de vârstă (U10, U12, U14, U16, U18)
- ✅ Compararea rezultatelor (îmbunătățire/declin)
- ✅ Statistici de performanță (medie, cel mai bun rezultat, rata de îmbunătățire)
- ✅ Control de acces pentru vizualizarea atletilor
- ✅ Filtrare și căutare date

### 4. Validation Tests
Testează validarea datelor și edge cases.

**Locație**: `src/__tests__/validation.test.ts`

**Acoperire**:
- ✅ Validare rezultate (timp, distanță, dată)
- ✅ Validare email
- ✅ Validare nume (cu caractere românești)
- ✅ Validare vârstă
- ✅ Gestionarea valorilor null/undefined
- ✅ Operații cu date și timp

## 🚀 Setup și Rulare

### Instalare Dependențe
```bash
npm install
```

### Rulare Toate Testele
```bash
npm test
```

### Rulare Teste în Watch Mode
```bash
npm run test:watch
```

### Rulare Teste cu Coverage
```bash
npm run test:coverage
```

### Rulare Teste Specifice
```bash
# Doar unit tests
npm test -- src/lib/__tests__

# Doar integration tests
npm test -- src/__tests__/integration.test.ts

# Doar un fișier specific
npm test -- crypto.test.ts
```

### Rulare în UI Mode (interactiv)
```bash
npm run test:ui
```

## 📁 Structura Testelor

```
src/
├── __tests__/
│   ├── setup.ts                    # Configurare globală teste
│   ├── integration.test.ts         # Integration tests
│   ├── business-logic.test.ts      # Teste logică de business
│   └── validation.test.ts          # Teste validare date
├── lib/
│   └── __tests__/
│       ├── crypto.test.ts          # Teste funcții criptare
│       ├── permissions.test.ts     # Teste sistem permisiuni
│       ├── utils.test.ts           # Teste utilitare
│       ├── auth-context.test.tsx   # Teste context autentificare
│       └── types.test.ts           # Teste validare tipuri
└── vitest.config.ts                # Configurare Vitest
```

## 📊 Coverage

Coverage-ul curent acoperă:

### Unit Tests
- **crypto.ts**: 100% - Toate funcțiile de hash și verificare parole
- **permissions.ts**: 95% - Sistem complet de permisiuni și roluri
- **utils.ts**: 100% - Funcții utilitare
- **auth-context.tsx**: 85% - Context de autentificare
- **types.ts**: 100% - Validări de tipuri

### Integration Tests
- **Athlete Management**: Lifecycle complet (CRUD + rezultate)
- **Access Requests**: Workflow părinți → antrenori
- **Messaging**: Sistem complet de mesaje
- **Multi-athlete Management**: Gestionare multipli atleți

### Business Logic Tests
- **Age Categories**: 100% acoperire toate categoriile
- **Performance Comparison**: 100% logică comparare
- **Statistics**: 100% calcule statistice
- **Access Control**: 100% reguli de acces
- **Data Filtering**: 100% funcționalități filtrare

### Validation Tests
- **Input Validation**: Email, nume, vârstă, rezultate
- **Edge Cases**: Null, undefined, array-uri goale
- **Date Operations**: Comparații, formatare, calcule

## 📈 Raport Coverage

După rularea `npm run test:coverage`, vei găsi:

- **Console**: Rezumat coverage în terminal
- **HTML Report**: `coverage/index.html` - Raport detaliat vizual
- **LCOV Report**: `coverage/lcov.info` - Pentru CI/CD

### Deschidere Raport HTML
```bash
# macOS
open coverage/index.html

# Linux
xdg-open coverage/index.html

# Windows
start coverage/index.html
```

## ✅ Best Practices

### 1. Naming Convention
```typescript
describe('ComponentName or Feature', () => {
  it('should do something specific', () => {
    // test code
  })
})
```

### 2. Test Structure (AAA Pattern)
```typescript
it('should calculate average correctly', () => {
  // Arrange - pregătește datele
  const results = [
    { value: 12.5, date: '2024-01-01' },
    { value: 13.0, date: '2024-01-02' }
  ]
  
  // Act - execută funcția
  const average = calculateAverage(results)
  
  // Assert - verifică rezultatul
  expect(average).toBeCloseTo(12.75)
})
```

### 3. Mock Data
```typescript
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  password: 'hash',
  firstName: 'Test',
  lastName: 'User',
  role: 'coach',
  isActive: true,
  createdAt: new Date().toISOString()
}
```

### 4. Test Isolation
Fiecare test trebuie să fie independent:
```typescript
beforeEach(() => {
  // Reset state înaintea fiecărui test
  athletes = []
  results = []
})
```

### 5. Assertions Clare
```typescript
// ❌ Rău
expect(result).toBe(true)

// ✅ Bun
expect(hasAccessToAthlete(parentId, athleteId, requests)).toBe(true)
```

## 🔧 Debugging Teste

### Rulare un singur test
```typescript
it.only('should test this one', () => {
  // acest test va rula singur
})
```

### Skip un test
```typescript
it.skip('should test this later', () => {
  // acest test va fi sărit
})
```

### Debug în VS Code
Adaugă breakpoint și apasă F5 după ce ai configurat `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

## 🎯 Obiective Coverage

Target-uri minime:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Current coverage: Vezi `npm run test:coverage`

## 📝 Adăugare Teste Noi

### 1. Creează fișier nou
```bash
touch src/lib/__tests__/new-feature.test.ts
```

### 2. Template de bază
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../new-feature'

describe('NewFeature', () => {
  it('should do something', () => {
    const result = myFunction()
    expect(result).toBeDefined()
  })
})
```

### 3. Rulează testul
```bash
npm test -- new-feature.test.ts
```

## 🔍 Exemple de Teste

### Test Simplu
```typescript
it('should add two numbers', () => {
  expect(2 + 2).toBe(4)
})
```

### Test cu Mock
```typescript
it('should call function with correct params', () => {
  const mockFn = vi.fn()
  mockFn('test')
  expect(mockFn).toHaveBeenCalledWith('test')
})
```

### Test Async
```typescript
it('should hash password', async () => {
  const hash = await hashPassword('test123')
  expect(hash).toBeDefined()
})
```

### Test cu Matchers Personalizați
```typescript
it('should be close to expected value', () => {
  expect(12.777).toBeCloseTo(12.78, 2)
})
```

## 🐛 Troubleshooting

### Teste nu pornesc
```bash
# Reinstalează dependențele
rm -rf node_modules package-lock.json
npm install
```

### Erori de import
Verifică `tsconfig.json` și `vite.config.ts` pentru alias-uri:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Coverage incomplet
Verifică excluderi în `vitest.config.ts`:
```typescript
coverage: {
  exclude: ['node_modules/', 'src/__tests__/']
}
```

## 📚 Resurse

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## 🤝 Contributing

Când adaugi cod nou, adaugă și teste:
1. Scrie testul înaintea codului (TDD) SAU
2. Scrie testul imediat după cod
3. Asigură-te că coverage-ul nu scade
4. Rulează toate testele înainte de commit

```bash
npm test && npm run test:coverage
```

---

**Nota**: Testele sunt configurate să ruleze automat în CI/CD pipeline. Coverage-ul minim este 70% pentru toate metrici.
