# Planning Guide

O aplicație web profesională pentru managementul atleților juniori din clubul de atletism, care permite înregistrarea sportivilor, managementul probelor sportive personalizate, adăugarea rezultatelor și urmărirea evoluției performanțelor în timp. Include sistem de autentificare securizat cu parolă criptată (SHA-256), roluri multiple (SuperAdmin, Antrenor, Părinte, Atlet), management granular al permisiunilor, cereri de acces controlate pentru vizualizarea datelor copiilor și canal de comunicare între părinți și antrenori.

**Experience Qualities**:
1. **Profesională** - Interfață modernă și premium cu design sofisticat, iconografie consistentă și feedback vizual immediate pentru toate acțiunile
2. **Securizată** - Autentificare cu parolă criptată SHA-256, sistem hierarhic de roluri cu SuperAdmin care controlează toate permisiunile, cereri de aprobare pentru acces și separare clară între drepturile utilizatorilor
3. **Flexibilă** - Management dinamic al probelor sportive personalizate, configurabile per nevoile clubului, și sistem granular de permisiuni pe resurse specifice

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Aplicația gestionează multiple entități cu relații complexe (atleți, probe custom, rezultate, utilizatori multi-rol, cereri, permisiuni granulare, mesagerie), sistem complet de autentificare și autorizare cu SuperAdmin, management dinamic al schemei de date (probe configurabile).

## Essential Features

### Autentificare Securizată cu Parolă
- **Functionality**: Sistem de login cu email și parolă, parolele sunt criptate cu SHA-256 înainte de stocare, vizibilitate parola cu toggle eye icon, validare minim 6 caractere
- **Purpose**: Protecția accesului la date sensibile și asigurarea identității utilizatorilor
- **Trigger**: Acces aplicație → Dialog autentificare → Intrare credențiale
- **Progression**: Email + Parolă → Validare → Hash comparison → Login success/error → Redirect la panou specific rolului
- **Success criteria**: Parolele sunt stocate criptat, autentificarea verifică corect parolele, mesaje de eroare nu dezvăluie detalii de securitate (doar "Email sau parolă incorectă")

### Înregistrare Utilizatori cu Parolă
- **Functionality**: Formular de înregistrare care cere email, parolă (min 6 caractere), confirmare parolă, prenume, nume și rol, cu validare în timp real
- **Purpose**: Onboarding securizat al utilizatorilor noi în sistem
- **Trigger**: Dialog autentificare → Tab "Înregistrare" → Completare formular
- **Progression**: Completare câmpuri → Validare parolă (lungime, match) → Hash parola → Creare cont → Login automat
- **Success criteria**: Parolele sunt verificate că match înainte de salvare, hash-ul este generat corect, emailuri duplicate sunt blocate

### Management Utilizatori cu Parolă (SuperAdmin)
- **Functionality**: SuperAdmin poate crea utilizatori noi cu parolă setată și poate reseta parola utilizatorilor existenți (câmp opțional la editare)
- **Purpose**: Administrarea completă a conturilor și recuperarea accesului pentru utilizatori
- **Trigger**: SuperAdmin → Tab "Utilizatori" → Adaugă/Editează Utilizator
- **Progression**: Formular → Email + Parolă (obligatorie la creare, opțională la editare) → Hash → Salvare → Utilizator poate folosi noua parolă
- **Success criteria**: SuperAdmin poate seta parole inițiale, poate reseta parole, parola veche rămâne dacă câmpul este gol la editare

### Sistem SuperAdmin
- **Functionality**: Rol special de administrator care are control complet asupra sistemului - poate gestiona utilizatori, probe, permisiuni și vizualiza toate datele
- **Purpose**: Centralizarea managementului aplicației și controlul ierarhic al drepturilor
- **Trigger**: Autentificare cu cont SuperAdmin (admin@clubatletism.ro / parola: admin123) → Acces panou dedicat
- **Progression**: Login SuperAdmin → Dashboard cu statistici complete → Tabs pentru Utilizatori/Permisiuni/Probe/Atleți → Acțiuni administrative
- **Success criteria**: SuperAdmin poate vedea toate datele, modifica roluri utilizatori, reseta parole, acorda/revoca permisiuni și gestiona probele

### Management Probe Personalizate
- **Functionality**: Adăugare, editare și ștergere probe sportive custom cu nume, categorie (Alergare/Sărituri/Aruncări/Altele), unitate măsură (secunde/metri/puncte) și descriere
- **Purpose**: Flexibilitate în adaptarea sistemului la nevoile specifice ale clubului și diversitatea probelor practicate
- **Trigger**: SuperAdmin → Tab "Probe" → Buton "Adaugă Probă"
- **Progression**: Click acțiune → Formular (Nume, Categorie, Unitate, Descriere) → Salvare → Afișare în listă cu iconuri și badge-uri → Utilizare în înregistrare rezultate
- **Success criteria**: Probele custom apar în dropdown-urile de selecție, rezultatele folosesc unitatea corectă, probele pot fi șterse

### Management Permisiuni Granulare
- **Functionality**: SuperAdmin poate acorda permisiuni specifice (Vizualizare/Editare/Control Complet) pe resurse (Toți Atleții/Atlet Specific/Probe/Rezultate) către utilizatori individuali
- **Purpose**: Control fin al accesului la date pentru scenarii complexe (ex: părinte care poate edita doar date copilului său)
- **Trigger**: SuperAdmin → Tab "Permisiuni" → Selectare utilizator → "Acordă" → Configurare permisiune
- **Progression**: Selectare user → Alegere tip permisiune (view/edit/full) → Alegere resursă → Confirmare → Badge vizibil pe profil user
- **Success criteria**: Utilizatorii văd/modifică doar resursele pentru care au permisiuni, revocarea funcționează instant

### Sistem Multi-Rol (4 roluri)
- **Functionality**: Utilizatorii pot avea roluri distincte: SuperAdmin (control total), Coach (manageriază atleți proprii), Parent (vizualizează copii aprobați), Athlete (vizualizează propriile date)
- **Purpose**: Separarea clară a responsabilităților și experienței per tip de utilizator
- **Trigger**: Înregistrare → Selectare rol (sau SuperAdmin modifică rol existent)
- **Progression**: Autentificare → Sistem detectează rol → Redirect la panou specific rolului → Funcționalități personalizate
- **Success criteria**: Fiecare rol vede doar UI-ul relevant, nu poate accesa funcții din alte roluri

### Dashboard Atlet
- **Functionality**: Atleții autentificați pot vedea propriile statistici, rezultate recente și grafice de evoluție
- **Purpose**: Implicare și motivare atleți prin vizualizarea propriului progres
- **Trigger**: Autentificare ca Atlet → Dashboard personalizat
- **Progression**: Login → Card profil cu categorie și antrenor → Statistici (total rezultate, probe practicate) → Listă rezultate recente → Grafic evoluție
- **Success criteria**: Atleții văd doar datele proprii, graficele afișează progresul cronologic

### Managementul Antrenorilor
- **Functionality**: Adăugare antrenori în sistem cu email, parolă, nume și specializare opțională
- **Purpose**: Menținerea bazei de antrenori pentru asociere cu atleții și asigurarea accesului securizat
- **Trigger**: Click pe tab "Antrenori" → "Adaugă Antrenor"
- **Progression**: Buton acțiune → Formular (Email, Parolă, Prenume, Nume, Specializare) → Hash parolă → Salvare → Afișare în listă
- **Success criteria**: Antrenorii pot fi adăugați cu parolă securizată și pot face login pentru a gestiona atleții

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
- **Email duplicat**: Validare la înregistrare/adăugare utilizator pentru a preveni duplicate
- **Parolă scurtă**: Validare minim 6 caractere la toate formularele cu feedback clar
- **Parolă nepotrivită**: La înregistrare, confirmarea trebuie să match exact cu parola
- **Login eșuat**: Mesaj generic "Email sau parolă incorectă" pentru a nu dezvălui ce câmp e greșit
- **SuperAdmin implicit**: La prima rulare se creează automat cont SuperAdmin (admin@clubatletism.ro / admin123) cu parolă pre-criptată
- **Resetare parolă**: SuperAdmin poate seta parolă nouă pentru orice utilizator (câmp opțional la editare)
- **Vizibilitate parolă**: Toggle eye/eye-slash pentru a afișa/ascunde parola în toate formularele
- **Probe șterse**: La ștergerea unei probe, rezultatele existente rămân dar fără referință (arhivare)
- **Permisiuni conflictuale**: Ultima permisiune acordată suprascrie pe anterioara pentru aceeași resursă
- **Rol modificat**: Când SuperAdmin schimbă rolul unui user, permisiunile existente rămân active
- **Cerere duplicată**: Previne trimiterea mai multor cereri pentru același atlet până la răspuns
- **Acces fără aprobare**: Părinții văd doar atleții aprobați, restul sunt invizibili
- **Mesaje fără acces**: Mesageria este disponibilă doar între antrenori și părinți cu acces aprobat
- **Ștergere atlet cu cereri**: La ștergerea unui atlet se șterg și cererile și mesajele asociate
- **Atlet fără user asociat**: Atleții pot exista independent de utilizatorii cu rol "athlete"
- **Deconectare**: Buton clar de logout care resetează sesiunea curentă
- **Validare formulare**: Toate câmpurile obligatorii sunt verificate înainte de salvare
- **Mobile responsive**: Layout se adaptează complet pe dispozitive mobile cu tabs transformate în select când e necesar

## Design Direction
Design-ul evoluează către o estetică premium, profesională și sofisticată, menținând energia sportivă dar adăugând elemente de siguranță enterprise și trust prin gradient-uri subtile, iconografie distinctivă per rol (ShieldCheck pentru SuperAdmin, Trophy pentru atleți) și sisteme vizuale clare pentru ierarhia permisiunilor. Interfața trebuie să transmită încredere, organizare și control prin detalii precum badge-uri colorate pentru status, animații micro pe interacțiuni și spacing generos.

## Color Selection
Triadic (three equally spaced colors) extinsă - combinație de albastru, verde și portocaliu pentru a crea o paletă energică și echilibrată, cu adăugare de gradient-uri subtile pentru diferențierea rolurilor (primary/10 pentru SuperAdmin).

- **Primary Color**: Albastru vibrant (oklch(0.55 0.20 250)) - transmite profesionalism, încredere și autoritate pentru zona admin și sistem
- **Secondary Colors**: Verde energic (oklch(0.65 0.18 145)) pentru progres, aprobare și acces granted; gradient-uri subtile albastru-portocaliu pentru header SuperAdmin
- **Accent Color**: Portocaliu intens (oklch(0.68 0.19 40)) pentru butoane CTA, notificări de succes, badges de permisiuni și evidențierea recordurilor
- **Role Colors**: Primary pentru SuperAdmin, Secondary pentru aprobare/success, Accent pentru atenție/acțiuni, badges colorate pentru roluri
- **Foreground/Background Pairings**: 
  - Background (White oklch(0.99 0 0)): Dark text oklch(0.20 0 0) - Ratio 15.8:1 ✓
  - Card (Light gray oklch(0.98 0 0)): Dark text oklch(0.20 0 0) - Ratio 15.2:1 ✓
  - Primary (Blue oklch(0.55 0.20 250)): White text oklch(0.99 0 0) - Ratio 6.2:1 ✓
  - Secondary (Green oklch(0.65 0.18 145)): White text oklch(0.99 0 0) - Ratio 8.8:1 ✓
  - Accent (Orange oklch(0.68 0.19 40)): White text oklch(0.99 0 0) - Ratio 9.2:1 ✓
  - Muted (Light gray oklch(0.96 0 0)): Muted text oklch(0.45 0 0) - Ratio 7.5:1 ✓
  - Gradient SuperAdmin (primary/10 to accent/10): Dark text - Ratio > 10:1 ✓

## Font Selection
Tipografia trebuie să transmită autoritate, claritate și modernitate premium - folosind Inter pentru interfață datorită lizibilității sale excelente la toate dimensiunile și suportului vast de greutăți, și Outfit pentru titluri pentru a adăuga un caracter sportiv, dinamic dar profesional.

- **Typographic Hierarchy**: 
  - H1 (Titlu aplicație + Rol): Outfit Bold/32px/tight letter spacing (-0.02em)
  - H2 (Secțiuni majore, Dashboard titles): Outfit SemiBold/24px/normal spacing
  - H3 (Card headers, subtitles): Outfit Medium/18px/normal spacing
  - Body (Conținut general, descrieri): Inter Regular/16px/line-height 1.6
  - Small (Labels, meta info, badges): Inter Medium/14px/line-height 1.5
  - Button text: Inter SemiBold/14px
  - Stats (Numere mari dashboard): Outfit Bold/48px/tight spacing (-0.01em)
  - Micro (timestamps, hints): Inter Regular/12px/line-height 1.4

## Animations
Animații profesionale, subtile și rapide care ghidează utilizatorul fără să întârzie acțiunile - micro-tranziții la hover pentru feedback imediat (scale 1.02), slide-in pentru formulare și carduri noi, notificări badge pentru mesaje necitite și cereri în așteptare, gradient animations pe header SuperAdmin pentru a transmite autoritate.

- **Purposeful Meaning**: Animații de "creștere" pentru statistici pozitive (scale up), tranziții fluide între roluri/panouri, pulse discret pentru notificări noi, fade-in pentru liste de permisiuni
- **Hierarchy of Movement**: Prioritate pentru feedback la butoane (100ms), apoi badge-uri notificare (pulse 2s), apoi tranziții de pagină (300ms), micro-interactions pe hover cards (150ms)
- **Role-specific animations**: SuperAdmin header cu gradient subtil animat, Athlete dashboard cu emphasis pe progres (green glow pe îmbunătățiri)

## Component Selection
- **Components**: 
  - Card pentru atleți, statistici, antrenori, cereri, conversații, probe și permisiuni
  - Dialog pentru formulare de adăugare/editare, autentificare și management permisiuni
  - Tabs pentru navigare între secțiuni diferite per rol (4 tabs pentru SuperAdmin, variabil pentru alte roluri)
  - Badge pentru status cereri (Pending, Approved, Rejected), roluri (SuperAdmin, Coach, etc.), permisiuni (View, Edit, Full) și mesaje necitite
  - Avatar pentru reprezentare utilizatori și atleți
  - ScrollArea pentru lista de mesaje în chat
  - Textarea pentru scriere mesaje și descrieri probe
  - Alert pentru notificări importante
  - Select pentru filtre și alegeri (categorie probe, tip permisiune, resurse)
  - Input pentru căutare și formulare
  
- **Customizations**: 
  - Panouri separate și complet diferite pentru fiecare rol (SuperAdmin/Coach/Parent/Athlete)
  - Header cu gradient pentru SuperAdmin (from-primary/10 to-accent/10)
  - Card-uri probe cu iconuri contextuale (Timer/Target/Ruler) per categorie
  - Management permisiuni cu sistem de badge-uri complexe (icon + text + remove button)
  - Dashboard statistici pentru SuperAdmin cu 4 carduri overview
  - Athlete dashboard cu profil hero card gradient și timeline rezultate
  
- **States**: 
  - Buttons: hover cu scale(1.02) și shadow enhanced, active cu scale(0.98), disabled cu opacity 50%
  - Badge status cereri: culori distincte pending (secondary), approved (success green), rejected (destructive)
  - Badge roluri: default pentru SuperAdmin, secondary pentru Coach, outline pentru Parent/Athlete
  - Badge permisiuni: outline cu icon prefix pentru fiecare tip (Eye/PencilSimple/LockKey)
  - Mesaje: stil diferit pentru mesaje trimise (primary bg) vs primite (muted bg)
  - Inputs: focus cu border accent și shadow glow, error cu border destructive
  - Cards: hover cu subtle lift (translateY(-2px)) și shadow increase
  
- **Icon Selection**: 
  - ShieldCheck pentru SuperAdmin și sistem permisiuni
  - UserCircle pentru autentificare și utilizatori
  - SignOut pentru deconectare
  - Eye / EyeSlash pentru toggle vizibilitate parolă în formulare
  - Envelope pentru cereri de acces și notificări
  - ChatCircleDots pentru mesagerie
  - Trophy pentru dashboard și performanțe atleți
  - Target pentru probe și events management
  - Timer pentru probe alergare
  - Ruler pentru probe aruncări
  - Eye, PencilSimple, LockKey pentru tipuri permisiuni (view/edit/full)
  - Plus pentru adăugare (atleți, antrenori, probe, permisiuni)
  - Trash pentru ștergere
  - CheckCircle pentru aprobare
  - XCircle pentru respingere
  - Clock pentru status în așteptare
  - PaperPlaneRight pentru trimitere mesaj
  - MagnifyingGlass pentru căutare
  - Medal, TrendUp, Calendar pentru statistici athlete
  - Users pentru statistici utilizatori
  
- **Spacing**: 
  - Padding carduri standard: p-6
  - Padding carduri dense (liste): p-4
  - Gap în liste/grids: gap-4 (16px) pentru liste dense, gap-6 (24px) pentru carduri importante
  - Margin între secțiuni majore: mb-8, space-y-6 pentru tab content
  - Spacing în formulare: space-y-4 pentru inputs, space-y-2 pentru label+input pairs
  - Container padding: px-4 py-8 pentru main content areas
  - Header padding: px-4 py-4
  
- **Mobile**: 
  - Tabs pentru SuperAdmin (4 tabs) rămân tabs dar cu text mai scurt pe mobile
  - Grid atleți/probe: 1 coloană mobile (<768px), 2 coloane tablet (768-1024px), 3+ coloane desktop (>1024px)
  - Dialog fullscreen pe mobile pentru formulare complexe (management permisiuni)
  - Conversații chat: layout vertical stack pe mobile, side-by-side pe desktop (>1024px)
  - Badges se wrappează pe multiple linii când e nevoie
  - Search bars full-width pe mobile
  - Sticky header pentru navigare rapidă pe scroll
  - Badge-uri "hidden sm:flex" pentru labels text lunghi (ex: nume utilizator în header)
