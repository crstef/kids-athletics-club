# 🧪 Guide pentru Rularea Testelor

## Cuprins
- [Comenzi Rapide](#comenzi-rapide)
- [Rezultate Așteptate](#rezultate-așteptate)
- [Cum să Interpretezi Rezultatele](#cum-să-interpretezi-rezultatele)
- [Depanare](#depanare)

---

## Comenzi Rapide

### 1️⃣ Rulează Toate Testele (Recommended)

```bash
npm test
```

Aceasta va rula toate testele o singură dată și va afișa rezultatele în terminal.

**Output Așteptat:**
```
✓ Business Logic: Athlete Age Categories (6)
✓ Business Logic: Performance Comparison (2)
✓ Business Logic: Result Statistics (6)
✓ Business Logic: Access Control (4)
✓ Business Logic: Data Filtering (6)
✓ Integration: Athlete Management Flow (3)
✓ Integration: Access Request Flow (3)
✓ Integration: Messaging Flow (3)
✓ Data Validation (12+)

Test Files  3 passed (3)
     Tests  45 passed (45)
  Duration  ~1-2s
```

### 2️⃣ Rulează Testele cu Detalii Complete

```bash
npm test -- --run --reporter=verbose
```

Afișează fiecare test individual cu statusul său.

### 3️⃣ Rulează Testele în Watch Mode (Development)

```bash
npm run test:watch
```

Testele vor rula automat când modifici fișierele. Perfect pentru development!

### 4️⃣ Rulează Testele cu Coverage Report

```bash
npm run test:coverage
```

Generează un raport detaliat despre acoperirea codului cu teste.

**Locație Raport:** `coverage/index.html` - Deschide în browser pentru vizualizare interactivă!

### 5️⃣ Rulează Testele în UI Mode (Interfață Vizuală)

```bash
npm run test:ui
```

Deschide o interfață web interactivă pentru rularea și explorarea testelor.

---

## Rezultate Așteptate

### ✅ Toate Testele Trec (SUCCESS)

Când vezi acest output, totul este perfect:

```
✓ src/__tests__/business-logic.test.ts (25)
✓ src/__tests__/integration.test.ts (9)
✓ src/__tests__/validation.test.ts (11+)

Test Files  3 passed (3)
     Tests  45 passed (45)
  Duration  1234ms
```

### ⚠️ Există Teste Care Nu Trec (FAILURE)

Dacă vezi erori:

```
✗ Business Logic: Performance Comparison
  ✓ should detect improvement in time-based events
  ✗ should detect improvement in distance-based events
    Expected: "improved", Received: "declined"
```

**Acțiune:** Verifică codul în cauză și repară problema.

---

## Structura Testelor

### 📁 `src/__tests__/business-logic.test.ts` (25 tests)

Testează funcționalitățile core ale aplicației:

1. **Athlete Age Categories** (6 tests)
   - Verifică asignarea corectă a categoriilor U10-U18
   - Testează edge cases (vârste în afara intervalului)

2. **Performance Comparison** (2 tests)
   - Compară rezultate pentru probe de timp (secunde)
   - Compară rezultate pentru probe de distanță (metri)

3. **Result Statistics** (6 tests)
   - Calcule de medii
   - Identificare cel mai bun rezultat
   - Calcul rată de îmbunătățire

4. **Access Control** (4 tests)
   - Verifică logica de acces părinte-copil
   - Testează aprobări/respingeri

5. **Data Filtering** (6 tests)
   - Filtrare atleți după antrenor
   - Filtrare după categorie
   - Căutare după nume (case-insensitive)

### 📁 `src/__tests__/integration.test.ts` (9 tests)

Testează fluxuri complete end-to-end:

1. **Athlete Management Flow** (3 tests)
   - Ciclu complet de viață al unui atlet
   - Management multipli atleți per antrenor
   - Tracking progres în timp

2. **Access Request Flow** (3 tests)
   - Workflow cerere de acces (pending → approved)
   - Respingere cereri
   - Filtrare cereri per antrenor

3. **Messaging Flow** (3 tests)
   - Trimitere/primire mesaje
   - Conversation threads
   - Contorizare mesaje necitite

### 📁 `src/__tests__/validation.test.ts` (11+ tests)

Testează validări și edge cases:

1. **Result Validation** (4 tests)
   - Validare valori timp pozitive
   - Validare distanțe
   - Validare formate date

2. **Email Validation** (2 tests)
   - Email-uri corecte
   - Email-uri invalide

3. **Name Validation** (2 tests)
   - Nume valide (cu diacritice românești)
   - Nume invalide

4. **Age Validation** (2 tests)
   - Vârste valide (8-18 ani)
   - Vârste invalide

5. **Edge Cases** (~12+ tests)
   - Array-uri goale
   - Valori null/undefined
   - Operații cu string-uri
   - Operații cu date

---

## Cum să Interpretezi Rezultatele

### Simboluri în Output

- `✓` (checkmark verde) = Test trecut cu succes
- `✗` (X roșu) = Test eșuat
- `⊙` (cerc) = Test skipped/ignorat
- `↻` (refresh) = Test în curs de rulare

### Măsurători Important

```
Test Files  3 passed (3)       ← Toate fișierele de test au trecut
     Tests  45 passed (45)     ← Toate testele individuale au trecut
  Duration  1234ms              ← Timpul total de execuție
```

### Coverage Report (după `npm run test:coverage`)

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files              |   75.23 |    68.45 |   72.11 |   75.23
 lib/crypto.ts         |   100   |    100   |   100   |   100
 lib/permissions.ts    |   85.5  |    75.2  |   82.3  |   85.5
 lib/utils.ts          |   92.1  |    88.4  |   90.0  |   92.1
```

**Target Coverage:** > 70% pentru toate categoriile ✅

---

## Depanare

### ❌ Problema: "Cannot find module '@/lib/types'"

**Soluție:**
```bash
# Verifică că path alias-urile sunt configurate corect
cat tsconfig.json | grep "@"
```

### ❌ Problema: "Test timeout exceeded"

**Soluție:**
```bash
# Crește timeout-ul în vitest.config.ts
# sau rulează testele cu flag:
npm test -- --testTimeout=10000
```

### ❌ Problema: "EADDRINUSE: port already in use"

**Soluție:**
```bash
# Kill procesul care folosește portul
npm run kill
# sau
fuser -k 5000/tcp
```

### ❌ Problema: Testele trec local dar eșuează în CI/CD

**Cauze Posibile:**
1. Dependențe lipsă - rulează `npm ci` în loc de `npm install`
2. Environment variables diferite
3. Timezone differences în teste de dată

**Soluție:**
```bash
# Asigură-te că toate dependențele sunt instalate
npm ci
# Rulează testele într-un environment curat
npm test
```

---

## Comenzi Avansate

### Rulează Doar un Fișier Specific

```bash
npm test src/__tests__/business-logic.test.ts
```

### Rulează Doar Teste Care Conțin un String

```bash
npm test -- -t "Athlete"
```

### Rulează Testele cu Update pe Snapshots

```bash
npm test -- -u
```

### Generează Coverage Report în Format Specific

```bash
npm run test:coverage -- --reporter=html
npm run test:coverage -- --reporter=json
npm run test:coverage -- --reporter=lcov
```

---

## Verificare Rapidă - Checklist

Înainte de commit, asigură-te că:

- [ ] `npm test` - Toate testele trec
- [ ] `npm run test:coverage` - Coverage > 70%
- [ ] `npm run lint` - Nicio eroare de linting
- [ ] `npm run build` - Build-ul reușește

---

## Resurse Adiționale

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [TESTING.md](./TESTING.md) - Ghid complet de testare
- [TEST-SUMMARY.md](./TEST-SUMMARY.md) - Rezumat al testelor existente
- [TEST-RESULTS.md](./TEST-RESULTS.md) - Rezultate detaliate ale testelor

---

## Support

Dacă întâmpini probleme:
1. Verifică acest ghid pentru soluții
2. Citește [TESTING.md](./TESTING.md) pentru detalii complete
3. Verifică [GitHub Issues](link-to-issues) pentru probleme cunoscute
