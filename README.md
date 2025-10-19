# Club Atletism - Management Atleți Juniori

## Cum să te loghezi în aplicație

### Credențiale Super Admin

Pentru a te loga ca **Super Admin** (cel care are acces complet la întreaga aplicație), folosește:

- **Email**: `admin@clubatletism.ro`
- **Nume**: Super
- **Prenume**: Admin

### Tipuri de utilizatori disponibili

Aplicația suportă 4 tipuri de utilizatori, fiecare cu permisiuni diferite:

#### 1. Super Admin
- **Email**: `admin@clubatletism.ro`
- **Acces**: Complet - poate gestiona toți utilizatorii, permisiunile, probele sportive și atleții
- **Funcționalități**:
  - Dashboard cu statistici generale
  - Gestionare permisiuni pentru toți utilizatorii
  - Adăugare/ștergere probe sportive
  - Vizualizare și gestionare atleți
  - Modificare roluri utilizatori

#### 2. Antrenor (Coach)
- **Email**: Orice email pe care îl înregistrezi
- **Acces**: Poate gestiona doar atleții săi
- **Funcționalități**:
  - Dashboard cu statisticile atletilor săi
  - Adăugare/vizualizare atleți
  - Adăugare rezultate pentru atleții săi
  - Primire și răspuns la cereri de acces de la părinți
  - Mesagerie cu părinții

#### 3. Părinte (Parent)
- **Email**: Orice email pe care îl înregistrezi
- **Acces**: Poate vizualiza doar copiii săi
- **Funcționalități**:
  - Vizualizare progres copii
  - Trimitere cereri de acces către antrenori
  - Mesagerie cu antrenorii
  - Vizualizare statistici și rezultate

#### 4. Atlet (Athlete)
- **Email**: Orice email pe care îl înregistrezi
- **Acces**: Poate vedea doar propriile date
- **Funcționalități**:
  - Vizualizare rezultate personale
  - Statistici și grafice de progres
  - Informații despre antrenor

### Cum să te înregistrezi / loghezi

1. Deschide aplicația
2. Click pe butonul **"Autentificare / Înregistrare"**
3. În dialogul care apare:
   - Introdu emailul tău
   - Introdu prenumele
   - Introdu numele
   - Selectează rolul (Coach, Parent sau Athlete)
4. Click pe **"Continuă"**

**Notă**: Pentru Super Admin, folosește emailul exact `admin@clubatletism.ro` - acest cont este creat automat la prima rulare a aplicației.

### Structura aplicației

```
Super Admin
  ├── Poate vedea și gestiona totul
  └── Are acces la:
      ├── Toate dashboardurile
      ├── Gestionare permisiuni
      ├── Gestionare probe sportive
      └── Gestionare atleți

Coach (Antrenor)
  ├── Vede doar atleții asignați lui
  └── Poate:
      ├── Adăuga atleți
      ├── Adăuga rezultate
      ├── Răspunde la cereri de acces
      └── Comunica cu părinții

Parent (Părinte)
  ├── Vede doar copiii săi
  └── Poate:
      ├── Trimite cereri de acces
      ├── Vizualiza rezultate copii
      └── Comunica cu antrenorii

Athlete (Atlet)
  ├── Vede doar datele personale
  └── Poate:
      ├── Vizualiza rezultate proprii
      └── Vedea informații despre antrenor
```

### Flux de lucru recomandat

1. **Loghează-te ca Super Admin** (`admin@clubatletism.ro`)
   - Configurează probele sportive
   - Adaugă antrenori dacă este necesar

2. **Înregistrează un antrenor**
   - Click pe tab "Antrenori"
   - Adaugă un antrenor nou

3. **Antrenorul adaugă atleți**
   - Loghează-te ca antrenor
   - Adaugă atleți și rezultatele lor

4. **Părinții solicită acces**
   - Înregistrează-te ca părinte
   - Trimite cerere de acces către antrenor

5. **Antrenorul aprobă cererile**
   - Verifică cererile în tab "Cereri"
   - Aprobă sau respinge

### Tehnologii folosite

- **React** + **TypeScript**
- **Tailwind CSS** pentru styling
- **shadcn/ui** pentru componente
- **useKV** pentru persistență locală
- **sonner** pentru notificări
- **Phosphor Icons** pentru iconițe
