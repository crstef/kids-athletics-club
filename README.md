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

### 📖 Documentation Complete

- **[SETUP-QUICK-START.md](./SETUP-QUICK-START.md)** - One-command setup for new subdomains 🚀
- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Comprehensive deployment guide with:
  - ✅ Automated deployment scripts with rollback support
  - ✅ Health checks and verification procedures
  - ✅ Troubleshooting common issues
  - ✅ Step-by-step manual deployment instructions
- **[DEPLOYMENT-COMMANDS.md](./DEPLOYMENT-COMMANDS.md)** - Legacy manual commands (reference)

### Quick Deployment Overview

**For Developers (Local Build & Push):**

```bash
# Build everything and push to GitHub
npm run build:all
git add .
git commit -m "feat: your changes"
git push origin main
```

**For Server Deployment:**

```bash
# Automated (recommended)
./scripts/server-deploy.sh

# Manual
git pull origin main && touch tmp/restart.txt
```

### Initial Server Setup

First-time production setup:

**Option 1: Automated Setup (Recommended)** 🚀

```bash
# SSH into your web server
ssh your-user@subdomain.hardweb.ro

# Navigate to your web directory
cd /home/youruser/public_html/subdomain

# Clone repository
git clone https://github.com/crstef/kids-athletics-club.git .

# Run automated setup script
chmod +x setup-server.sh
./setup-server.sh
```

The script will guide you through:
- Database configuration
- Environment setup  
- Dependency installation
- Database initialization
- Web server configuration
- Health checks

**Option 2: Manual Setup**

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Configure environment
cp server/.env.example server/.env.production
# Edit server/.env.production with your credentials

# 3. Initialize database
chmod +x init-db.sh
./init-db.sh

# 4. Build (on local machine, then push to GitHub)
npm run build:all
git push origin main

# 5. On server: pull and start
git pull origin main
touch tmp/restart.txt  # Restart Passenger
```

**📚 For detailed deployment instructions, troubleshooting, and rollback procedures, see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)**

---

# 3. Initialize database
chmod +x init-db.sh
./init-db.sh

# 4. Build (on local machine, then push to GitHub)
npm run build:all
git push origin main

# 5. On server: pull and start
git pull origin main
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
- Mesaje: poate conversa cu orice utilizator din sistem

### Antrenor (Coach)
- Adăugare și management atleți proprii
- Înregistrare rezultate pentru atleții săi
- Comunicare cu părinții
- **Aprobare/respingere cereri de cont** - antrenorii aprobă înregistrări noi de părinți și atleți (creează automat profilul de atlet la aprobare)
- Vizualizare istoric ultimele 15 cereri procesate (aprobate/respinse)
- Mesaje: poate discuta cu atleții săi (conturi athlete) și cu părinții acelor atleți
- Tab-ul „Utilizatori”: vede doar propriul cont și conturile atleților săi

### Părinte (Parent)
- Vizualizare informații copil/copii
- Solicitare acces pentru vizualizare date copil
- Comunicare cu antrenorii
- Vizualizare evoluție și rezultate
- Mesaje: poate discuta cu antrenorul copilului și cu SuperAdminii
- Tab-ul „Utilizatori”: vede doar propriul cont

### Atlet (Athlete)
- Vizualizare propriile rezultate
- Vizualizare evoluție personală
- Informații despre antrenor
- Mesaje: poate discuta doar cu propriul antrenor
- Tab-ul „Utilizatori”: vede doar propriul cont

## 🚀 Funcționalități SuperAdmin

### Management Utilizatori
- **Creare utilizatori** - formular adaptiv care cere aceleași câmpuri ca procesul public de înregistrare
- **Paritate cu înregistrarea publică** - pentru rolurile *Athlete* și *Parent* se solicită antrenorul, copilul și profilul sportiv; salvarea creează automat profilul de atlet și legătura părinte ↔ copil ↔ antrenor
- **Editare utilizatori** - modifică informațiile utilizatorilor existenți
- **Ștergere utilizatori** - elimină utilizatori din sistem (cu excepția SuperAdmin)
- **Filtrare și căutare** - găsește rapid utilizatori după nume, email sau rol
- **Vizibilitate contextuală** - lista utilizatorilor este filtrată automat: SuperAdmin vede tot, antrenorul își vede doar contul și atleții, iar părinții și atleții își văd doar propriul profil

### Aprobare Conturi (SuperAdmin vs Coach)

**SuperAdmin:**
- Vede **toate** cererile de aprobare din sistem (indiferent de antrenor)
- Aprobă cereri de tip:
  - **Coach** - antrenori noi care se înregistrează
  - **Parent** - părinți care solicită acces pentru copiii lor
  - **Athlete** - atleți noi (creează automat profilul în baza de date)
- Vizualizează istoric complet cu ultimele 15 cereri procesate
- Tab **"Aprobări"** afișează panoul global de administrare cereri

**Coach:**
- Vede **doar** cererile legate de atleții săi
- Aprobă cereri de tip:
  - **Parent** - părinți care solicită acces pentru un atlet din grupa sa
  - **Athlete** - atleți noi care se înregistrează cu el ca antrenor
- **NU** poate aproba cereri de tip **Coach** (doar SuperAdmin)
- Vizualizează istoric propriu cu ultimele 15 cereri procesate
- Tab **"Aprobări"** afișează:
  1. **Cereri în așteptare** - cereri noi de la părinți/atleți
  2. **Istoric procesate** - ultimele 15 cereri aprobate/respinse

**Diferențe Cheie:**
- SuperAdmin → acces global, aprobă **toți** rolurile (inclusiv Coach)
- Coach → acces limitat la proprii atleți, **NU** poate aproba Coach
- Ambele roluri văd notificări badge cu numărul de cereri în așteptare
- Aprovarea unui **Athlete** creează automat profilul complet (nume, vârstă, categorie, gen, dată naștere) din metadata cererii

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

> ℹ️  Hook reminder: the shared `useApi` helpers now mark datasets as “fetched” even when a request fails, so the UI won’t hammer the API on repeated 500 responses. Use the hook’s returned `refetch` function (or switch tabs) when you’re ready to retry after resolving the issue.

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

- Conturile create de SuperAdmin înainte de 06.11.2025 nu includ noul profil de atlet/legături părinte; recreează-le din tab-ul "Utilizatori" pentru date corecte
- SuperAdmin poate vedea și gestiona toți atleții din sistem
- Fiecare antrenor vede doar atleții săi (cu excepția SuperAdmin)
- Părinții trebuie să solicite acces pentru a vizualiza datele copiilor
- Nu poți șterge propriul cont de SuperAdmin
- Ștergerea unui utilizator elimină și datele asociate (mesaje, cereri, etc.)
- Vizibilitatea în tab-urile „Mesaje” și „Utilizatori” este restricționată pe rol conform regulilor de mai sus; dacă nu vezi un contact sau un utilizator, verifică legăturile atlet ↔ părinte ↔ antrenor

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
