# 🔧 Probleme Identificate și Soluții

## 1️⃣ PROBLEMA: Antrenor nu poate loga fără permisiuni manuale

### Cauza:
- Când se creează user cu rol `coach`, primește rolul dar **nu și permisiunile**
- `role_permissions` există în DB dar nu se aplică automat la login
- Sistemul verifică `user_permissions` individual, nu permisiunile din rol

### Soluție:
Modifică logica de login să includă **permisiunile din rol + permisiuni user individuale**:

```typescript
// În authController.ts - după verificare parolă:
// 1. Obține permisiunile din ROL
const rolePermissions = await client.query(`
  SELECT p.name
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.name = $1
`, [user.role]);

// 2. Obține permisiunile INDIVIDUALE
const userPermissions = await client.query(`
  SELECT p.name
  FROM user_permissions up
  JOIN permissions p ON up.permission_id = p.id
  WHERE up.user_id = $1
`, [user.id]);

// 3. Combină permisiunile (elimină duplicate)
const allPermissions = [
  ...rolePermissions.rows.map(r => r.name),
  ...userPermissions.rows.map(r => r.name)
];
const uniquePermissions = [...new Set(allPermissions)];
```

---

## 2️⃣ PROBLEMA: Probe hardcodate în AddResultDialog

### Cauza:
- `AddResultDialog.tsx` folosește `EVENT_CATEGORIES` (constante hardcodate)
- Ignoră complet tabelul `coach_probes` din baza de date

### Soluție:
**Modifică AddResultDialog să citească din `probes`:**

```tsx
// AddResultDialog.tsx
interface AddResultDialogProps {
  athleteId: string
  athleteName: string
  probes: CoachProbe[]  // ← ADAUGĂ
  onAdd: (result: Omit<Result, 'id'>) => void
}

// În component:
<SelectContent>
  {probes.map((probe) => (
    <SelectItem key={probe.id} value={probe.name}>
      {probe.name} - {probe.description}
    </SelectItem>
  ))}
</SelectContent>
```

**Modifică tipul Result:**
```typescript
// types.ts
export interface Result {
  id: string
  athleteId: string
  eventType: string  // ← de la EventType la string (nume probă din DB)
  value: number
  unit: 'seconds' | 'meters'  // sau detectat automat din probe
  date: string
  notes?: string
}
```

---

## 3️⃣ PROBLEMA: Câmp "Specializare" (probe_id în users)

### Unde se folosește:
- În tabelul `users` există coloana `probe_id`
- Nu se folosește NICĂIERI în aplicație!
- La register se salvează dar nu are logică

### Soluție:
**OPȚIUNE A - Păstrează dacă vrei filtrare antrenori:**
- Antrenorii pot fi filtrați după specializare
- Ex: "Arată doar antrenorii specializați în Sprint"

**OPȚIUNE B - Șterge coloana:**
```sql
ALTER TABLE users DROP COLUMN IF EXISTS probe_id;
```

### Recomandare:
**PĂSTREAZĂ** - folosește pentru:
1. Badge pe profil antrenor: "Specialist Sprint"
2. Filtrare în listele de antrenori
3. Statistici: "3 antrenori Sprint, 2 Sărituri, 1 Aruncări"

---

## 4️⃣ PROBLEMA: Tabelul "evenimente" (events)

### Structură actuală:
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(100),
    date TIMESTAMP,
    location VARCHAR(200),
    description TEXT,
    created_by UUID REFERENCES users(id)
);
```

### Unde se folosește:
- Tab "Evenimente" în SuperAdmin/Coach dashboard
- **NU** se leagă de `results` (rezultate nu au event_id)
- Pare să fie pentru competiții/meeting-uri

### Confuzie:
- `Result.eventType` = tip probă (60m, 100m, etc.)
- `events.type` = tip eveniment (???)

### Soluție propusă:
**OPȚIUNE A - Evenimente = Competiții:**
```typescript
interface Event {
  id: string
  name: string  // "Campionatul Național U14"
  type: 'competition' | 'training' | 'test'
  date: string
  location: string
  description: string
  createdBy: string
}
```

**OPȚIUNE B - Leagă Results de Evenimente:**
```sql
ALTER TABLE results 
ADD COLUMN event_id UUID REFERENCES events(id);
```
Astfel poți grupa rezultate: "Toate rezultatele de la Campionatul X"

**OPȚIUNE C - Șterge tabela:**
Dacă nu o folosești pentru competiții.

---

## 5️⃣ PROBLEMA: User șters misterios

### Cauze posibile:
1. **Constraint DELETE CASCADE** - dacă antrenorul e legat de altceva
2. **Validation fail** la register → rollback transaction
3. **needs_approval = true** → user inactiv → apare "șters"

### Debug:
Adaugă logging în `authController.ts`:
```typescript
console.log('[AUTH] User created:', user.id, user.email, user.role);
console.log('[AUTH] Approval needed:', user.needs_approval);
```

### Fix:
În `register`:
```typescript
// Setează is_active = true pentru coaches dacă nu vrei aprobare
const needsApproval = role === 'coach' ? false : true;
const isActive = role === 'coach' ? true : false;

const result = await client.query(
  `INSERT INTO users (email, password, first_name, last_name, role, is_active, needs_approval)
   VALUES ($1, $2, $3, $4, $5, $6, $7)
   RETURNING *`,
  [email, hashedPassword, firstName, lastName, role, isActive, needsApproval]
);
```

---

## 📊 PLAN DE ACȚIUNE:

### Prioritate CRITICĂ:
1. ✅ **Fix login cu permisiuni din rol** - antrenorii trebuie să poată loga
2. ✅ **Înlocuiește constante cu probes din DB** - rezultatele trebuie să folosească probe reale

### Prioritate MEDIE:
3. ⚠️ **Clarifică scopul `events`** - competiții sau șterge tabela
4. ⚠️ **Debug user deletion** - de ce se șterge antrenorul

### Prioritate JOASĂ:
5. 💡 **Specializare antrenor** - adaugă UI pentru filtrare/display
6. 💡 **Statistici avansate** - pe gen, categorie, specializare

---

## 🎯 Următorii pași:

1. **Modifică authController** - permisiuni din rol
2. **Modifică AddResultDialog** - probe din DB
3. **Analizează events** - păstram sau ștergem?
4. **Testează register coach** - de ce se șterge?

Vrei să încep cu fix-urile?
