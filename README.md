# Club Atletism - Management Atleți

Aplicație web pentru managementul atleților juniori din cadrul clubului de atletism.

## 📋 Cuprins

- [Acces SuperAdmin](#-acces-superadmin)
- [Roluri în Sistem](#-roluri-în-sistem)
- [Funcționalități](#-funcționalități-superadmin)
- [Testare](#-testare)
- [Development](#-development)

## 🔐 Acces SuperAdmin

Pentru a accesa panoul de administrare SuperAdmin, folosește următoarele credențiale:

**Email:** `admin@clubatletism.ro`
**Parolă:** `admin123`

Contul de SuperAdmin este creat automat la prima rulare a aplicației.

## 👥 Roluri în Sistem

### SuperAdmin
- Acces complet la toate funcționalitățile
- Management utilizatori (creare, editare, ștergere)
- Management roluri utilizatori
- Configurare probe sportive
- Administrare permisiuni
- Vizualizare și management atleți

### Antrenor (Coach)
- Adăugare și management atleți proprii
- Înregistrare rezultate pentru atleții săi
- Comunicare cu părinții
- Aprobare/respingere cereri de acces de la părinți

### Părinte (Parent)
- Vizualizare informații copil/copii
- Solicitare acces pentru vizualizare date copil
- Comunicare cu antrenorii
- Vizualizare evoluție și rezultate

### Atlet (Athlete)
- Vizualizare propriile rezultate
- Vizualizare evoluție personală
- Informații despre antrenor

## 🚀 Funcționalități SuperAdmin

### Management Utilizatori
- **Creare utilizatori** - adaugă noi utilizatori în sistem cu orice rol
- **Editare utilizatori** - modifică informațiile utilizatorilor existenți
- **Ștergere utilizatori** - elimină utilizatori din sistem (cu excepția SuperAdmin)
- **Filtrare și căutare** - găsește rapid utilizatori după nume, email sau rol

### Management Roluri
- Schimbă rolul oricărui utilizator (cu excepția SuperAdmin)
- Configurează specializări pentru antrenori
- Administrează accesul și permisiunile

### Configurare Sistem
- Definește probe sportive personalizate
- Configurează categorii de vârstă
- Administrează permisiuni granulare

## 📊 Structura Datelor

Toate datele sunt persistate local folosind `useKV` hook:
- `users` - lista tuturor utilizatorilor
- `athletes` - lista atleților
- `results` - rezultatele sportive
- `events` - probele sportive configurate
- `permissions` - permisiunile acordate
- `access-requests` - cererile de acces de la părinți
- `messages` - mesajele între utilizatori

## 🧪 Testare

Aplicația include o suită completă de teste:

### Tipuri de Teste
- ✅ **Unit Tests** - Funcții individuale (crypto, permissions, utils)
- ✅ **Integration Tests** - Fluxuri complete (athletes, access requests, messaging)
- ✅ **Business Logic Tests** - Logica specifică domeniului
- ✅ **Validation Tests** - Validări de date și edge cases

### Rulare Teste

```bash
# Rulează toate testele
npm test

# Rulează testele în watch mode
npm run test:watch

# Rulează testele cu coverage
npm run test:coverage

# Rulează testele în UI mode (interactiv)
npm run test:ui
```

### Coverage Target
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Documentație Completă Testare
Vezi [TESTING.md](./TESTING.md) pentru:
- Structura detaliată a testelor
- Exemple de teste
- Best practices
- Troubleshooting
- Cum să adaugi teste noi

## 💻 Development

### Instalare Dependențe
```bash
npm install
```

### Rulare în Development Mode
```bash
npm run dev
```

### Build pentru Producție
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🔧 Cum Funcționează

1. **Prima Rulare**: Contul SuperAdmin este creat automat
2. **Autentificare**: Folosește credențialele SuperAdmin pentru acces complet
3. **Adăugare Utilizatori**: Din tab-ul "Utilizatori", poți crea conturi noi
4. **Configurare**: Setează probele sportive din tab-ul "Probe"
5. **Management**: Administrează utilizatorii, atleții și permisiunile

## 💡 Tips

- SuperAdmin poate vedea și gestiona toți atleții din sistem
- Fiecare antrenor vede doar atleții săi (cu excepția SuperAdmin)
- Părinții trebuie să solicite acces pentru a vizualiza datele copiilor
- Nu poți șterge propriul cont de SuperAdmin
- Ștergerea unui utilizator elimină și datele asociate (mesaje, cereri, etc.)

## 🎯 Workflow Tipic

1. SuperAdmin creează conturi pentru antrenori
2. Antrenorii adaugă atleți în sistem
3. Antrenorii înregistrează rezultate pentru atleți
4. Părinții se înregistrează și solicită acces pentru a vedea datele copiilor
5. Antrenorii aprobă/resping cererile de acces
6. Părinții și antrenorii pot comunica prin mesaje

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Hooks + useKV
- **Charts**: Recharts + D3
- **Icons**: Phosphor Icons
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite

## 📁 Structura Proiectului

```
src/
├── components/          # Componente React
│   ├── ui/             # shadcn UI components
│   └── ...             # Componente business
├── lib/                # Utilități și logică
│   ├── __tests__/      # Unit tests
│   ├── auth-context.tsx
│   ├── crypto.ts
│   ├── permissions.ts
│   ├── types.ts
│   └── utils.ts
├── __tests__/          # Integration tests
├── App.tsx             # Componenta principală
└── index.css           # Stiluri globale
```

## 📝 Note Importante

- Aplicația folosește autentificare cu parole criptate (SHA-256)
- Toate datele sunt stocate local folosind spark.kv API
- Pentru producție, se recomandă implementarea unui backend dedicat
- Testele asigură calitatea și stabilitatea codului

## 🤝 Contributing

1. Scrie cod
2. Adaugă teste pentru codul nou
3. Rulează `npm test` pentru a verifica testele
4. Rulează `npm run test:coverage` pentru coverage
5. Asigură-te că coverage-ul este > 70%
6. Commit & Push

## 📄 Licență

Acest proiect este proprietate privată.
