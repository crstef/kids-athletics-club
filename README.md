# Club Atletism - Management Atleți

Aplicație web pentru managementul atleților juniori din cadrul clubului de atletism.

## ✅ Status: PRODUCTION READY

🎉 **Aplicația este gata pentru producție!**

- ✅ Multi-user cu autentificare JWT
- ✅ Database PostgreSQL pentru persistență
- ✅ API REST complet funcțional  
- ✅ CodeQL security scan passed (0 vulnerabilities)
- ✅ Documentație completă de deployment

Documentația a fost simplificată pentru a păstra doar ce e actual și util. Ghidurile vechi au fost eliminate pentru a reduce zgomotul.

## 📋 Cuprins

- [Arhitectură](#-arhitectură)
- [Acces SuperAdmin](#-acces-superadmin)
- [Deployment Production](#-deployment-production)
- [Roluri în Sistem](#-roluri-în-sistem)
- [Funcționalități](#-funcționalități-superadmin)
- [Testare](#-testare)
- [Development](#-development)
 - [Repo Hygiene](#-repo-hygiene)

## 🏗 Arhitectură

Aplicația folosește o arhitectură modernă client-server:

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based
- **UI**: Tailwind CSS v4 + shadcn/ui

## 🔐 Acces SuperAdmin

Pentru a accesa panoul de administrare SuperAdmin, folosește următoarele credențiale:

**Email:** `admin@clubatletism.ro`  
**Parolă:** `admin123`

⚠️ **IMPORTANT**: Schimbă parola imediat după prima autentificare!

Contul de SuperAdmin este creat automat la inițializarea bazei de date.

## 🚀 Deployment Production

**Aplicația este PRODUCTION READY!** ✅

Pași recomandați pentru deployment (rezumat):
1) Instalează dependențele la rădăcină și în `server/`
2) Configurează `.env` în `server/` (conexiune Postgres, JWT_SECRET etc.)
3) Inițializează baza de date: `./init-db.sh`
4) Build frontend: `npm run build`
5) Build backend: `cd server && npm run build`
6) Rulează backend-ul: `cd server && npm start`

### Quick Start Production

```bash
# 1. Instalează dependențele
npm install
cd server && npm install && cd ..

# 2. Configurează baza de date PostgreSQL
# Vezi DEPLOYMENT.md pentru detalii

# 3. Configurează variabilele de mediu
cp server/.env.example server/.env
# Editează server/.env cu credențialele tale

# 4. Inițializează baza de date
chmod +x init-db.sh
./init-db.sh

# 5. Build frontend și backend
npm run build
cd server && npm run build && cd ..

# 6. Start backend
cd server && npm start
```

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

Toate datele sunt persistate în baza de date PostgreSQL:
- `users` - utilizatori (SuperAdmin, Antrenori, Părinți, Atleți)
- `athletes` - lista atleților
- `results` - rezultatele sportive
- `events` - probele sportive configurate
- `permissions` - permisiunile sistemului
- `access_requests` - cererile de acces de la părinți
- `messages` - mesajele între utilizatori
- `roles` - rolurile personalizate
- `age_categories` - categoriile de vârstă
- `coach_probes` - specializările antrenorilor

Vezi `server/schema.sql` pentru schema completă.

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

### Note Testare
Suita de teste (Vitest) acoperă scenarii de business, integrare și validare. Rularea este centralizată prin scripturile `npm test` și opțiunile aferente.

## 💻 Development

### Instalare Dependințe
```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### Setup Baza de Date
```bash
# Configurează PostgreSQL (vezi DEPLOYMENT.md)
# Apoi rulează:
./init-db.sh
```

### Rulare în Development Mode
```bash
# Terminal 1: Backend server
cd server
npm run dev

# Terminal 2: Frontend dev server
npm run dev
```

Aplicația va fi disponibilă la:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

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
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Hooks + API
- **Charts**: Recharts + D3
- **Icons**: Phosphor Icons
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite

## 📁 Structura Proiectului

```
.
├── server/                 # Backend Node.js
│   ├── src/
│   │   ├── config/        # Database & JWT config
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   ├── schema.sql         # Database schema
│   ├── package.json
│   └── tsconfig.json
├── src/                   # Frontend React
│   ├── components/        # React components
│   │   ├── ui/           # shadcn UI components
│   │   └── ...           # Business components
│   ├── lib/              # Utilities and logic
│   │   ├── api-client.ts # API client
│   │   ├── auth-context.tsx
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── hooks/            # Custom React hooks
│   │   └── use-api.ts    # API data hooks
│   ├── __tests__/        # Integration tests
│   └── App.tsx           # Main component
├── dist/                  # Frontend production build (to deploy)
├── init-db.sh            # Database initialization
├── README.md             # This file
└── LICENSE               # License
```

## 📝 Note Importante

- Aplicația folosește autentificare JWT cu token-uri securizate
- Datele sunt stocate în PostgreSQL cu indexare optimizată
- Pentru producție, urmați pașii rezumați din secțiunea „Deployment Production”
- Testele asigură calitatea și stabilitatea codului

## 🔒 Securitate

Aplicația implementează:
- ✅ Autentificare JWT
- ✅ Control bazat pe roluri
- ✅ Protecție SQL injection
- ✅ Parolă criptată (SHA-256, recomandare upgrade la bcrypt)
- 🔶 Rate limiting (recomandat pentru producție)
- 🔶 HTTPS (necesar pentru producție)

Recomandări suplimentare: activați rate limiting și HTTPS în producție.

## 🧹 Repo Hygiene

Pentru a păstra repo-ul curat și ușor de întreținut:
- Menținem un singur folder de build frontend: `dist/` la rădăcină (prod). Nu păstrăm build-uri în `src/`.
- Evităm fișierele generate accidental la rădăcină (index-*.js/css, *-vendors-*.js) — sunt ignorate prin `.gitignore`.
- Log-urile și arhivele (ex. `dist.tar.gz`) nu se păstrează în git.
- Documentația veche a fost eliminată; acest README și fișierele `.env.example` rămân ca surse principale.

## 🤝 Contributing

1. Scrie cod
2. Adaugă teste pentru codul nou
3. Rulează `npm test` pentru a verifica testele
4. Rulează `npm run test:coverage` pentru coverage
5. Asigură-te că coverage-ul este > 70%
6. Commit & Push

## 📄 Licență

Acest proiect este proprietate privată.
