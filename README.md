# Club Atletism - Management Atleți Juniori

Aplicație web pentru gestionarea atleților juniori dintr-un club de atletism, cu roluri multiple și funcționalități complete de management.

## 🚀 Pornire Rapidă

### Instalare
```bash
npm install
```

### Rulare
```bash
npm run dev
```

Aplicația va fi disponibilă la `http://localhost:5173`

## 👥 Credențiale de Test

### SuperAdmin (Acces Complet)
- **Email**: `admin@clubatletism.ro`
- **Parolă**: `admin123`
- **Permisiuni**: Acces complet la toate funcționalitățile, gestionare utilizatori, probe, permisiuni

### Antrenor (Coach)
- **Email**: `antrenor@clubatletism.ro`
- **Parolă**: `coach123`
- **Permisiuni**: Gestionare atleți proprii, rezultate, comunicare cu părinți

### Părinte (Parent)
- **Email**: `parinte@clubatletism.ro`
- **Parolă**: `parent123`
- **Permisiuni**: Vizualizare copii, cereri de acces, comunicare cu antrenori

### Atlet
- **Email**: `atlet@clubatletism.ro`
- **Parolă**: `athlete123`
- **Permisiuni**: Vizualizare rezultate proprii, statistici personale

## 📋 Funcționalități Principale

### Pentru SuperAdmin
- ✅ Dashboard complet cu statistici globale
- ✅ Gestionare utilizatori (antrenori, părinți, atleți)
- ✅ Gestionare probe atletice
- ✅ Sistem de permisiuni granulare
- ✅ Modificare roluri utilizatori
- ✅ Vizualizare și management atleți

### Pentru Antrenor
- ✅ Dashboard cu statistici atleți proprii
- ✅ Adăugare și editare atleți
- ✅ Adăugare și ștergere rezultate
- ✅ Gestionare cereri de acces de la părinți
- ✅ Sistem de mesagerie cu părinții
- ✅ Filtrare și sortare atleți
- ✅ Vizualizare detalii complete atlet

### Pentru Părinte
- ✅ Vizualizare copii înregistrați
- ✅ Cereri de acces la antrenori
- ✅ Comunicare cu antrenori
- ✅ Vizualizare rezultate copii
- ✅ Grafice evoluție performanță
- ✅ Notificări mesaje noi

### Pentru Atlet
- ✅ Vizualizare rezultate proprii
- ✅ Statistici personale
- ✅ Grafice evoluție
- ✅ Informații antrenor

## 🎨 Tehnologii Folosite

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Phosphor Icons** - Iconițe
- **Recharts** - Grafice
- **Sonner** - Toast notifications
- **Framer Motion** - Animații
- **useKV** - Persistență date locale

## 📁 Structura Aplicației

```
src/
├── App.tsx                      # Componenta principală
├── components/
│   ├── AddAthleteDialog.tsx     # Dialog adăugare atlet
│   ├── AddCoachDialog.tsx       # Dialog adăugare antrenor
│   ├── AddResultDialog.tsx      # Dialog adăugare rezultat
│   ├── AthleteCard.tsx          # Card afișare atlet
│   ├── AthleteDashboard.tsx     # Dashboard atlet
│   ├── AthleteDetailsDialog.tsx # Detalii complete atlet
│   ├── AuthDialog.tsx           # Dialog autentificare
│   ├── CoachAccessRequests.tsx  # Gestionare cereri acces
│   ├── DashboardStats.tsx       # Statistici dashboard
│   ├── EventManagement.tsx      # Gestionare probe
│   ├── MessagingPanel.tsx       # Panou mesagerie
│   ├── ParentAccessRequest.tsx  # Cerere acces părinte
│   ├── ParentDashboard.tsx      # Dashboard părinte
│   ├── PerformanceChart.tsx     # Grafic performanță
│   ├── PermissionsManagement.tsx # Gestionare permisiuni
│   ├── SuperAdminDashboard.tsx  # Dashboard superadmin
│   └── ui/                      # Componente shadcn
├── lib/
│   ├── auth-context.tsx         # Context autentificare
│   ├── types.ts                 # Tipuri TypeScript
│   └── utils.ts                 # Utilități
└── index.css                    # Stiluri globale
```

## 🎯 Categorii Vârstă

- **U10** - Sub 10 ani
- **U12** - Sub 12 ani
- **U14** - Sub 14 ani
- **U16** - Sub 16 ani
- **U18** - Sub 18 ani

## 📊 Probe Atletice

Aplicația suportă multiple probe:
- Sprint: 60m, 100m, 200m, 400m
- Semifond: 800m, 1500m
- Sărituri: Lungime, Înălțime, Triplu
- Aruncări: Greutate, Disc, Suliță

## 🔐 Sistem de Roluri

### SuperAdmin
- Acces complet la toate funcționalitățile
- Nu poate fi șters
- Poate modifica roluri utilizatori

### Antrenor (Coach)
- Vede doar atleții proprii
- Poate adăuga/edita atleți și rezultate
- Poate comunica cu părinții
- Aprobă/respinge cereri de acces

### Părinte (Parent)
- Vede doar copiii proprii
- Poate cere acces la antrenori
- Poate comunica cu antrenorii copiilor

### Atlet (Athlete)
- Vede doar rezultatele proprii
- Acces read-only la date

## 💾 Persistență Date

Aplicația folosește `useKV` hooks pentru persistență locală:
- `athletes` - Lista atleți
- `results` - Rezultate competiții
- `users` - Utilizatori sistem
- `access-requests` - Cereri de acces
- `messages` - Mesaje între utilizatori
- `events` - Probe atletice
- `permissions` - Permisiuni speciale

## 🎨 Design & UX

- **Palette**: Culori vibrante (albastru primary, verde secondary, portocaliu accent)
- **Typography**: Inter (body) + Outfit (headings)
- **Layout**: Responsive, mobile-first
- **Animații**: Subtile, funcționale (framer-motion)
- **Icons**: Phosphor Icons - modern, consistent
- **Components**: shadcn/ui v4 - profesional, accesibil

## 🧪 Testare

### Scenarii de Testare

1. **Login SuperAdmin**
   - Testează toate secțiunile dashboard-ului
   - Adaugă probe noi
   - Modifică permisiuni
   - Schimbă roluri utilizatori

2. **Login Antrenor**
   - Adaugă atleți noi
   - Adaugă rezultate
   - Aprobă cereri de acces
   - Trimite mesaje către părinți

3. **Login Părinte**
   - Vizualizează copii
   - Creează cerere acces la antrenor
   - Trimite mesaj antrenorului

4. **Login Atlet**
   - Vizualizează rezultate
   - Vezi statistici personale

## 🐛 Debugging

Aplicația folosește `sonner` pentru notificări:
- ✅ Succes (verde)
- ❌ Eroare (roșu)
- ℹ️ Info (albastru)

## 📝 TODO / Viitoare Îmbunătățiri

- [ ] Export date (CSV/PDF)
- [ ] Calendar competiții
- [ ] Planuri antrenament
- [ ] Upload imagini/documente
- [ ] Notificări push
- [ ] Statistici avansate
- [ ] Comparații între atleți
- [ ] Sistem de badge-uri/realizări

## 🤝 Contribuții

Pentru bug-uri sau sugestii, deschide un issue sau contact dezvoltatorul.

## 📄 Licență

Proprietate privată - Club Atletism Management System

---

**Dezvoltat cu ❤️ pentru managementul atleților juniori**
