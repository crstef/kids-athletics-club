# Planning Guide

O aplicație web pentru managementul atleților juniori din clubul de atletism, care permite înregistrarea sportivilor, adăugarea rezultatelor la diferite probe sportive și urmărirea evoluției performanțelor în timp.

**Experience Qualities**:
1. **Organizată** - Structură clară și intuitivă pentru navigarea între atleți, probe și rezultate
2. **Motivantă** - Design vibrant și energic care reflectă spiritul sportiv și celebrează progresul copiilor
3. **Eficientă** - Acces rapid la informații esențiale și adăugare simplă de noi date

**Complexity Level**: Light Application (multiple features with basic state)
  - Aplicația gestionează multiple entități (atleți, probe, rezultate) cu relații între ele și necesită persistență a datelor, dar fără funcționalități complexe de autentificare sau procese workflow avansate.

## Essential Features

### Managementul Atleților
- **Functionality**: Adăugare, vizualizare, editare și ștergere atleți cu informații despre nume, vârstă, categorie și data înscrierii
- **Purpose**: Menținerea bazei de date actualizate cu membrii clubului
- **Trigger**: Click pe butonul "Adaugă Atlet" sau selecție atlet existent
- **Progression**: Buton acțiune → Formular completare (Nume, Prenume, Vârstă, Categorie) → Salvare → Afișare în listă
- **Success criteria**: Atleții sunt salvați persistent și pot fi accesați între sesiuni

### Înregistrarea Rezultatelor
- **Functionality**: Adăugare rezultate la diferite probe atletice (alergare, sărituri, aruncări) cu dată și performanță
- **Purpose**: Documentarea performanțelor sportivilor la antrenamente și competiții
- **Trigger**: Selectare atlet → Click "Adaugă Rezultat"
- **Progression**: Selectare atlet → Formular (Probă, Dată, Rezultat, Unitate măsură) → Salvare → Vizualizare în istoric
- **Success criteria**: Rezultatele sunt asociate corect cu atleții și sortate cronologic

### Vizualizarea Evoluției
- **Functionality**: Afișare grafică a evoluției performanțelor unui atlet la o anumită probă în timp
- **Purpose**: Identificarea progresului și a zonelor care necesită îmbunătățiri
- **Trigger**: Selectare atlet → Vizualizare detalii → Selectare probă
- **Progression**: Selecție atlet → Pagină profil → Filtrare pe probă → Grafic cu trend temporal
- **Success criteria**: Graficul afișează corect datele și permite identificarea rapidă a trendurilor

### Dashboard General
- **Functionality**: Vedere de ansamblu cu statistici rapide: număr total atleți, recorduri recente, probe active
- **Purpose**: Acces rapid la informațiile esențiale ale clubului
- **Trigger**: Acces inițial în aplicație
- **Progression**: Încărcare aplicație → Dashboard cu carduri statistici → Navigare către secțiuni detaliate
- **Success criteria**: Informațiile sunt actualizate automat și reflectă starea curentă

## Edge Case Handling
- **Atleți fără rezultate**: Afișare mesaj friendly "Niciun rezultat înregistrat încă" cu CTA pentru adăugare
- **Rezultate invalide**: Validare formular pentru valori numerice pozitive și date în trecut
- **Ștergere atlet cu rezultate**: Dialog de confirmare care avertizează că se vor șterge și rezultatele asociate
- **Probe diferite unități**: Suport pentru secunde (alergare), metri (sărituri/aruncări), și altele cu conversie automată
- **Sortare și filtrare**: Opțiuni pentru sortare după nume, vârstă, categorie și filtrare pe probe specifice

## Design Direction
Design-ul trebuie să evoce energie, dinamism și optimism - specific mediului sportiv pentru copii. Interfața să fie vibrantă, cu accente colorate care celebrează realizările, dar suficient de profesională pentru utilizare serioasă de către antrenori. Echilibru între funcționalitate (liste clare, formulare simple) și elemente motivaționale (badge-uri, culori energice pentru statistici).

## Color Selection
Triadic (three equally spaced colors) - combinație de albastru, portocaliu și verde pentru a crea o paletă energică și echilibrată care reflectă diversitatea sportului și entuziasmul copiilor.

- **Primary Color**: Albastru vibrant (oklch(0.55 0.20 250)) - transmite profesionalism, încredere și stabilitate specifică organizațiilor sportive
- **Secondary Colors**: Verde energic (oklch(0.65 0.18 145)) pentru progres și realizări; Portocaliu cald (oklch(0.70 0.17 45)) pentru acțiuni și atenție
- **Accent Color**: Portocaliu intens (oklch(0.68 0.19 40)) pentru butoane CTA, notificări de succes și evidențierea recordurilor
- **Foreground/Background Pairings**: 
  - Background (White oklch(0.99 0 0)): Dark text oklch(0.20 0 0) - Ratio 15.8:1 ✓
  - Card (Light gray oklch(0.98 0 0)): Dark text oklch(0.20 0 0) - Ratio 15.2:1 ✓
  - Primary (Blue oklch(0.55 0.20 250)): White text oklch(0.99 0 0) - Ratio 6.2:1 ✓
  - Secondary (Green oklch(0.65 0.18 145)): White text oklch(0.99 0 0) - Ratio 8.8:1 ✓
  - Accent (Orange oklch(0.68 0.19 40)): White text oklch(0.99 0 0) - Ratio 9.2:1 ✓
  - Muted (Light gray oklch(0.96 0 0)): Muted text oklch(0.45 0 0) - Ratio 7.5:1 ✓

## Font Selection
Tipografia trebuie să transmită claritate și modernitate, cu un caracter puternic dar accesibil - folosind Inter pentru interfață datorită lizibilității sale excelente la toate dimensiunile și Outfit pentru titluri pentru a adăuga un caracter sportiv și dinamic.

- **Typographic Hierarchy**: 
  - H1 (Titlu aplicație): Outfit Bold/32px/tight letter spacing (-0.02em)
  - H2 (Secțiuni): Outfit SemiBold/24px/normal spacing
  - H3 (Card headers): Outfit Medium/18px/normal spacing
  - Body (Conținut general): Inter Regular/16px/line-height 1.6
  - Small (Labels, meta): Inter Medium/14px/line-height 1.5
  - Stats (Numere mari): Outfit Bold/48px/tight spacing

## Animations
Animații subtile și rapide care ghidează utilizatorul fără să întârzie acțiunile - micro-tranziții la hover pentru feedback imediat, slide-in pentru formulare și carduri noi, și celebrări discrete când se adaugă recorduri noi.

- **Purposeful Meaning**: Animații de "creștere" pentru statistici pozitive (scale up), tranziții fluide între secțiuni pentru continuitate vizuală, și feedback vibrant la acțiuni de salvare
- **Hierarchy of Movement**: Prioritate pentru feedback la butoane (100ms), apoi la schimbări de stare (200ms), și în final la tranziții de pagină (300ms)

## Component Selection
- **Components**: 
  - Card pentru atleți și statistici dashboard
  - Dialog pentru formulare de adăugare/editare atleți și rezultate
  - Table pentru listarea rezultatelor și atleților
  - Select pentru alegerea probelor atletice
  - Input și Label pentru formulare
  - Button pentru acțiuni principale (variant primary) și secundare (variant outline)
  - Badge pentru categorii de vârstă și tipuri de probe
  - Tabs pentru navigare între secțiuni (Atleți, Rezultate, Statistici)
  - Avatar pentru reprezentare vizuală a atleților
  - Progress pentru vizualizare rapidă a progresului
  
- **Customizations**: 
  - Componente custom pentru grafice folosind D3 pentru evoluția performanțelor
  - Card customizat "AthleteCard" cu statistici quick-view
  - Componente ResultCard pentru afișarea rezultatelor cu cod culoare bazat pe progres
  
- **States**: 
  - Buttons: hover cu scale(1.02) și shadow, active cu scale(0.98), disabled cu opacity 50%
  - Inputs: focus cu border accent și shadow glow, error cu border destructive
  - Cards: hover cu lift subtle (shadow transition)
  
- **Icon Selection**: 
  - Plus pentru adăugare atleți/rezultate
  - ChartLine pentru vizualizări și evoluție
  - Trophy pentru recorduri și performanțe top
  - User/Users pentru secțiunea atleți
  - CalendarBlank pentru selecție dată
  - ListNumbers pentru rezultate și clasamente
  - PencilSimple pentru editare
  - Trash pentru ștergere
  - Medal pentru categorii și realizări
  
- **Spacing**: 
  - Padding carduri: p-6
  - Gap în liste/grids: gap-4 (16px) pentru liste, gap-6 (24px) pentru carduri
  - Margin între secțiuni: mb-8
  - Spacing în formulare: space-y-4
  
- **Mobile**: 
  - Tabs transformate în Select dropdown pe mobile
  - Table convertit în stacked cards sub 768px
  - Grid de atleți: 1 coloană mobile, 2 tabletă, 3+ desktop
  - Dialog fullscreen pe mobile pentru formulare
  - Bottom sheet pentru acțiuni rapide
