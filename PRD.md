# Planning Guide

O aplicație web pentru managementul atleților juniori din clubul de atletism, care permite înregistrarea sportivilor, adăugarea rezultatelor la diferite probe sportive și urmărirea evoluției performanțelor în timp. Include sistem de autentificare pentru antrenori și părinți, cereri de acces pentru vizualizarea datelor copiilor, și canal de comunicare între părinți și antrenori.

**Experience Qualities**:
1. **Organizată** - Structură clară și intuitivă pentru navigarea între atleți, probe și rezultate, cu roluri distincte pentru antrenori și părinți
2. **Sigură** - Sistem de cereri și aprobare pentru accesul părinților la datele copiilor, asigurând controlul antrenorilor
3. **Comunicativă** - Canal direct de mesagerie între părinți și antrenori pentru discuții despre progresul copiilor

**Complexity Level**: Light Application (multiple features with basic state)
  - Aplicația gestionează multiple entități (atleți, probe, rezultate, utilizatori, cereri) cu relații complexe între ele, sistem de autentificare simplu și mesagerie, dar fără funcționalități avansate de backend.

## Essential Features

### Sistem de Autentificare
- **Functionality**: Înregistrare și autentificare simplă pentru antrenori și părinți cu email, nume și rol
- **Purpose**: Controlul accesului la date și funcționalități specifice fiecărui rol
- **Trigger**: Acces aplicație fără cont activ
- **Progression**: Ecran login → Tab Autentificare/Înregistrare → Completare date (Email, Nume, Rol) → Salvare → Acces panou personalizat
- **Success criteria**: Utilizatorii pot crea conturi, se pot autentifica și accesa funcționalități specifice rolului lor

### Managementul Antrenorilor
- **Functionality**: Adăugare antrenori în sistem cu email, nume și specializare opțională
- **Purpose**: Menținerea bazei de antrenori pentru asociere cu atleții
- **Trigger**: Click pe tab "Antrenori" → "Adaugă Antrenor"
- **Progression**: Buton acțiune → Formular (Email, Prenume, Nume, Specializare) → Salvare → Afișare în listă
- **Success criteria**: Antrenorii pot fi adăugați și asociați cu atleții

### Asociere Atlet-Antrenor
- **Functionality**: La adăugarea unui atlet se poate selecta antrenorul responsabil din listă
- **Purpose**: Stabilirea relației dintre atleți și antrenori pentru gestionarea accesului
- **Trigger**: Adăugare/editare atlet → Selectare antrenor din dropdown
- **Progression**: Formular atlet → Câmp "Antrenor" → Selectare din listă → Salvare cu asociere
- **Success criteria**: Atleții au antrenori asociați vizibili în sistem

### Cereri de Acces Părinte
- **Functionality**: Părinții pot cere acces la datele copilului lor selectând atletul și trimitând o cerere către antrenor
- **Purpose**: Controlul accesului la date sensibile ale minorilor
- **Trigger**: Părinte autentificat → Tab "Cereri Acces" → Selectare atlet → Mesaj opțional
- **Progression**: Selectare atlet → Scriere mesaj → Trimite cerere → Status "În așteptare" → Notificare antrenor
- **Success criteria**: Cererile sunt trimise cu succes și apar în panoul antrenorului

### Aprobare/Respingere Cereri (Antrenor)
- **Functionality**: Antrenorii văd cererile în așteptare și pot aproba sau respinge accesul
- **Purpose**: Control asupra cine poate vedea datele atleților
- **Trigger**: Cerere nouă → Notificare în tab "Cereri" → Click Aprobă/Respinge
- **Progression**: Vizualizare cerere cu detalii (Părinte, Atlet, Mesaj) → Decizie → Confirmare → Actualizare status
- **Success criteria**: Cererile sunt procesate și părinții primesc acces doar dacă sunt aprobați

### Vizualizare Date Copil (Părinte)
- **Functionality**: După aprobare, părinții pot vedea atleții aprobați, rezultatele și evoluția performanțelor
- **Purpose**: Transparență și implicare părinților în progresul copiilor
- **Trigger**: Acces aprobat → Dashboard părinte → Carduri atleți → Click detalii
- **Progression**: Panou părinte → Lista copii aprobați → Click atlet → Vizualizare rezultate și grafice evoluție
- **Success criteria**: Părinții văd doar datele pentru care au primit aprobare

### Canal de Comunicare
- **Functionality**: Mesagerie directă între părinți și antrenori referitoare la atleți aprobați
- **Purpose**: Facilitarea comunicării despre progres, probleme, întrebări
- **Trigger**: Tab "Mesaje" → Selectare destinatar → Scriere mesaj
- **Progression**: Selectare antrenor/părinte → Vizualizare conversație → Scriere text → Trimitere → Notificare destinatar
- **Success criteria**: Mesajele sunt livrate în timp real, conversațiile sunt organizate per destinatar, status de citit/necitit

### Managementul Atleților (existent)
- **Functionality**: Adăugare, vizualizare, editare și ștergere atleți cu informații despre nume, vârstă, categorie, data înscrierii și antrenor
- **Purpose**: Menținerea bazei de date actualizate cu membrii clubului
- **Trigger**: Click pe butonul "Adaugă Atlet" sau selecție atlet existent
- **Progression**: Buton acțiune → Formular completare (Nume, Prenume, Vârstă, Categorie, Antrenor) → Salvare → Afișare în listă
- **Success criteria**: Atleții sunt salvați persistent și pot fi accesați între sesiuni

### Înregistrarea Rezultatelor (existent)
- **Functionality**: Adăugare rezultate la diferite probe atletice cu dată și performanță
- **Purpose**: Documentarea performanțelor sportivilor
- **Trigger**: Selectare atlet → Click "Adaugă Rezultat"
- **Progression**: Selectare atlet → Formular (Probă, Dată, Rezultat, Unitate măsură) → Salvare → Vizualizare în istoric
- **Success criteria**: Rezultatele sunt asociate corect cu atleții și sortate cronologic

### Vizualizarea Evoluției (existent)
- **Functionality**: Afișare grafică a evoluției performanțelor unui atlet la o anumită probă în timp
- **Purpose**: Identificarea progresului și a zonelor care necesită îmbunătățiri
- **Trigger**: Selectare atlet → Vizualizare detalii → Selectare probă
- **Progression**: Selecție atlet → Pagină profil → Filtrare pe probă → Grafic cu trend temporal
- **Success criteria**: Graficul afișează corect datele și permite identificarea rapidă a trendurilor

## Edge Case Handling
- **Email duplicat**: Validare la înregistrare/adăugare antrenor pentru a preveni duplicate
- **Cerere duplicată**: Previne trimiterea mai multor cereri pentru același atlet până la răspuns
- **Acces fără aprobare**: Părinții văd doar atleții aprobați, restul sunt invizibili
- **Mesaje fără acces**: Mesageria este disponibilă doar între antrenori și părinți cu acces aprobat
- **Ștergere atlet cu cereri**: La ștergerea unui atlet se șterg și cererile și mesajele asociate
- **Deconectare**: Buton clar de logout care resetează sesiunea curentă
- **Atleți fără antrenor**: Atleții pot exista fără antrenor asociat inițial
- **Validare formulare**: Toate câmpurile obligatorii sunt verificate înainte de salvare

## Design Direction
Design-ul păstrează energia și dinamismul sportiv, dar adaugă elemente de profesionalism și siguranță pentru sistemul de acces controlat. Interfața trebuie să fie clară în distingerea rolurilor (Antrenor vs Părinte) și să evidențieze starea cererilor și mesajelor necitite prin badge-uri vizibile.

## Color Selection
Triadic (three equally spaced colors) - combinație de albastru, portocaliu și verde pentru a crea o paletă energică și echilibrată care reflectă diversitatea sportului și entuziasmul copiilor.

- **Primary Color**: Albastru vibrant (oklch(0.55 0.20 250)) - transmite profesionalism, încredere și stabilitate specifică organizațiilor sportive
- **Secondary Colors**: Verde energic (oklch(0.65 0.18 145)) pentru progres și acces aprobat; Portocaliu cald (oklch(0.70 0.17 45)) pentru acțiuni și atenție
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
Animații subtile și rapide care ghidează utilizatorul fără să întârzie acțiunile - micro-tranziții la hover pentru feedback imediat, slide-in pentru formulare și carduri noi, notificări badge pentru mesaje necitite și cereri în așteptare.

- **Purposeful Meaning**: Animații de "creștere" pentru statistici pozitive (scale up), tranziții fluide între roluri/panouri, pulse pentru notificări noi
- **Hierarchy of Movement**: Prioritate pentru feedback la butoane (100ms), apoi badge-uri notificare (pulse), apoi tranziții de pagină (300ms)

## Component Selection
- **Components**: 
  - Card pentru atleți, statistici, antrenori, cereri și conversații
  - Dialog pentru formulare de adăugare/editare și autentificare
  - Tabs pentru navigare între secțiuni diferite per rol
  - Badge pentru status cereri (Pending, Approved, Rejected) și mesaje necitite
  - Avatar pentru reprezentare utilizatori și atleți
  - ScrollArea pentru lista de mesaje în chat
  - Textarea pentru scriere mesaje
  - Alert pentru notificări importante
  
- **Customizations**: 
  - Panouri separate pentru Antrenor vs Părinte cu funcționalități distincte
  - Componente chat cu bule de mesaje și timestamp
  - Badge-uri numerice pentru cereri și mesaje necitite
  - Cards de cereri cu butoane Aprobă/Respinge
  
- **States**: 
  - Buttons: hover cu scale(1.02) și shadow, active cu scale(0.98), disabled cu opacity 50%
  - Badge status: culori distincte pentru pending (secondary), approved (success green), rejected (destructive)
  - Mesaje: stil diferit pentru mesaje trimise (primary) vs primite (muted)
  - Inputs: focus cu border accent și shadow glow, error cu border destructive
  
- **Icon Selection**: 
  - UserCircle pentru autentificare
  - SignOut pentru deconectare
  - Envelope pentru cereri de acces și notificări
  - ChatCircleDots pentru mesagerie
  - CheckCircle pentru aprobare
  - XCircle pentru respingere
  - Clock pentru status în așteptare
  - Plus pentru adăugare (atleți, antrenori)
  - Trophy pentru dashboard și performanțe
  - PaperPlaneRight pentru trimitere mesaj
  
- **Spacing**: 
  - Padding carduri: p-6
  - Gap în liste/grids: gap-4 (16px) pentru liste, gap-6 (24px) pentru carduri
  - Margin între secțiuni: mb-8
  - Spacing în formulare și chat: space-y-4
  
- **Mobile**: 
  - Tabs transformate în Select dropdown pe mobile dacă sunt multe
  - Conversații chat: layout vertical pe mobile, side-by-side pe desktop
  - Grid antrenori/atleți: 1 coloană mobile, 2 tabletă, 3+ desktop
  - Dialog fullscreen pe mobile pentru formulare
  - Sticky header pentru navigare rapidă
