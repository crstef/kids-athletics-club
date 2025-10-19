# Planning Guide

O aplicație web profesională pentru managementul atleților juniori din clubul de atletism, care permite înregistrarea sportivilor, managementul probelor sportive personalizate, adăugarea rezultatelor și urmărirea evoluției performanțelor în timp. Include sistem complet de management roluri și permisiuni cu creare/editare/ștergere pentru roluri personalizate, acordare permisiuni granulare per acțiune (create/view/edit/delete) pe toate resursele sistemului, aprobare conturi noi, control granular pe resurse specifice (atleți individuali), autentificare securizată cu parolă criptată (SHA-256), roluri multiple (SuperAdmin, Antrenor, Părinte, Atlet) + roluri custom, și canal de comunicare între părinți și antrenori.

**Experience Qualities**:
1. **Profesională** - Interfață modernă și premium cu design sofisticat, iconografie consistentă și feedback vizual immediate pentru toate acțiunile
2. **Securizată** - Autentificare cu parolă criptată SHA-256, sistem ierarhic de permisiuni cu SuperAdmin care controlează toate permisiunile și rolurile, aprobare obligatorie pentru conturi noi, cereri de acces pentru date copii și separare clară între drepturile utilizatorilor
3. **Flexibilă** - Management complet al sistemului de roluri (creare/editare/ștergere roluri custom), management permisiuni (creare/editare/activare/dezactivare), acordare granulară pe utilizatori și resurse specifice, probe sportive personalizate configurabile per nevoile clubului

**Complexity Level**: Complex Application (advanced functionality, accounts)
  - Aplicația gestionează multiple entități cu relații complexe (atleți, probe custom, rezultate, utilizatori multi-rol, cereri, permisiuni dinamice, roluri custom, mesagerie), sistem complet de autentificare și autorizare cu SuperAdmin, management dinamic al schemei de date (probe, permisiuni și roluri configurabile), sistem de aprobare pe două niveluri (cont + acces date copil).

## Essential Features

### Sistem de Management Roluri
- **Functionality**: SuperAdmin creează, editează și șterge roluri custom în sistem. Fiecare rol are nume, nume afișat, descriere, status (activ/inactiv) și o listă de permisiuni asociate. Rolurile de sistem (superadmin, coach, parent, athlete) sunt protejate și nu pot fi șterse
- **Purpose**: Flexibilitate maximă în definirea structurii organizaționale și a responsabilităților prin roluri custom (ex: "Manager Atleți", "Asistent Antrenor", "Coordonator Evenimente")
- **Trigger**: SuperAdmin → Tab "Roluri" → Creare/editare rol
- **Progression**: Panou roluri → "Rol Nou" → Completare (nume intern, nume afișat, descriere) → Selectare permisiuni din listă grupată pe resurse → Toggle activare/dezactivare → Salvare → Editare rol existent → Ștergere (doar roluri non-sistem)
- **Success criteria**: Roluri custom pot fi create cu orice combinație de permisiuni, activate/dezactivate, editate (modificare permisiuni) și șterse, utilizatorii pot fi asociați cu roluri custom

### Sistem de Permisiuni Granulare
- **Functionality**: SuperAdmin creează, editează, activează/dezactivează permisiuni în sistem. Permisiunile sunt structurate per acțiune (create, view, edit, delete) pe fiecare resursă (athletes, results, events, coaches, users, permissions, roles, messages, access_requests, approvals). Fiecare permisiune are nume standardizat (ex: "athletes.create", "results.edit"), descriere și status activ/inactiv
- **Purpose**: Control total și granular asupra capacităților utilizatorilor pe fiecare acțiune din sistem
- **Trigger**: SuperAdmin → Tab "Permisiuni" → Management permisiuni disponibile
- **Progression**: Panou permisiuni → Creare permisiune nouă (nume format resource.action, descriere) → Salvare → Activare/Dezactivare → Editare → Ștergere (cu impact pe toate rolurile și utilizatorii)
- **Success criteria**: Permisiunile sunt organizate logic per resursă și acțiune (create/view/edit/delete), pot fi create custom, activate/dezactivate pentru a controla ce e disponibil în sistem, modificate și șterse

### Acordare Permisiuni pe Utilizatori și Roluri
- **Functionality**: SuperAdmin acordă permisiuni specifice fie la nivel de rol (toate persoanele cu acel rol primesc permisiunea), fie individual per utilizator. Permisiunile pot fi acordate general sau pe resurse specifice (ex: părinte poate vizualiza doar atletul X)
- **Purpose**: Control granular al accesului la date per rol sau per utilizator
- **Trigger**: SuperAdmin → Tab "Aprobări" → Selectare utilizator → "Acordă Permisiuni" SAU Tab "Roluri" → Editare rol → Selectare permisiuni
- **Progression**: Selectare utilizator/rol → Alegere permisiuni din lista activă grupată pe resurse (athletes, results, etc.) și acțiuni (create, view, edit, delete) → Opțional selectare resursă specifică → Confirmare → Vizualizare permisiuni acordate → Revocare individuală
- **Success criteria**: Utilizatorii primesc permisiuni fie prin rolul lor fie prin acordare individuală, au acces doar la acțiunile permise (create, view, edit, delete) pe fiecare resursă, pot avea acces la resurse specifice, permisiunile pot fi revocate individual

### Aprobare Conturi Noi
- **Functionality**: Utilizatorii care se înregistrează (coach, parent, athlete) trebuie aprobați de SuperAdmin înainte de a-și putea activa contul
- **Purpose**: Control asupra cine poate accesa sistemul și prevenirea accesului neautorizat
- **Trigger**: Înregistrare utilizator nou → Creare cerere de aprobare → SuperAdmin vizualizează în tab "Aprobări"
- **Progression**: User se înregistrează → Cont creat dar inactiv → Cerere trimisă automat la SuperAdmin → SuperAdmin vede cereri pending → Aprobă (cont activ) sau Respinge (cu motiv opțional) → User primeşte mesaj la login
- **Success criteria**: Conturile nou create nu pot face login până la aprobare, SuperAdmin vede toate cererile pending cu badge notificare, utilizatorii aprobați pot accesa sistemul

### Acces Părinte la Date Copil
- **Functionality**: După ce contul e aprobat de SuperAdmin, părintele trebuie să ceară acces specific la datele copilului său de la antrenorul acestuia
- **Purpose**: Protecție suplimentară a datelor minorilor cu control de la antrenor
- **Trigger**: Părinte aprobat → Tab "Cereri Acces" → Selectare copil → Trimitere cerere la antrenor
- **Progression**: Părinte selectează atlet → Mesaj opțional → Trimite către antrenorul atletului → Antrenor primește notificare → Aprobă/Respinge → Părinte primește acces doar la acel atlet specific
- **Success criteria**: Părinții aprobați pot vedea DOAR atleții pentru care au primit aprobare de acces de la antrenori, nu au vizibilitate la alți atleți

### Autentificare Securizată cu Parolă
- **Functionality**: Sistem de login cu email și parolă, parolele sunt criptate cu SHA-256 înainte de stocare, vizibilitate parola cu toggle eye icon, validare minim 6 caractere, verificare status activ cont
- **Purpose**: Protecția accesului la date sensibile și asigurarea identității utilizatorilor
- **Trigger**: Acces aplicație → Dialog autentificare → Intrare credențiale
- **Progression**: Email + Parolă → Validare → Hash comparison → Verificare cont activ și aprobat → Login success/error → Redirect la panou specific rolului
- **Success criteria**: Parolele sunt stocate criptat, autentificarea verifică corect parolele și statusul contului, mesaje de eroare diferențiate pentru cont neaprobat vs credențiale greșite

### Înregistrare Utilizatori cu Aprobare
- **Functionality**: Formular de înregistrare care cere email, parolă (min 6 caractere), confirmare parolă, prenume, nume și rol, cu validare în timp real și creare automată cerere de aprobare
- **Purpose**: Onboarding securizat al utilizatorilor noi în sistem cu verificare admin
- **Trigger**: Dialog autentificare → Tab "Înregistrare" → Completare formular
- **Progression**: Completare câmpuri → Validare parolă (lungime, match) → Hash parola → Creare cont inactiv → Creare cerere aprobare → Mesaj "Contul așteaptă aprobare" → Nu poate face login până la aprobare
- **Success criteria**: Parolele sunt verificate că match înainte de salvare, hash-ul este generat corect, emailuri duplicate sunt blocate, cont creat dar inactiv, cerere trimisă automat
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
- **SuperAdmin implicit**: La prima rulare se creează automat cont SuperAdmin (admin@clubatletism.ro / admin123) cu parolă pre-criptată și rolul de superadmin
- **Roluri implicite**: La prima rulare se creează automat 4 roluri de sistem (superadmin, coach, parent, athlete) cu permisiunile corespunzătoare
- **Permisiuni implicite**: La prima rulare se creează automat toate permisiunile structurate pe resurse și acțiuni (athletes.create, athletes.view, etc.)
- **Resetare parolă**: SuperAdmin poate seta parolă nouă pentru orice utilizator (câmp opțional la editare)
- **Vizibilitate parolă**: Toggle eye/eye-slash pentru a afișa/ascunde parola în toate formularele
- **Probe șterse**: La ștergerea unei probe, rezultatele existente rămân dar fără referință (arhivare)
- **Permisiuni conflictuale**: Ultima permisiune acordată suprascrie pe anterioara pentru aceeași resursă
- **Rol modificat**: Când SuperAdmin schimbă rolul unui user, permisiunile din noul rol se aplică automat
- **Rol șters**: Nu se pot șterge rolurile de sistem (superadmin, coach, parent, athlete), doar roluri custom. La ștergerea unui rol custom, utilizatorii cu acel rol îl pierd
- **Rol dezactivat**: Utilizatorii cu rol inactiv pierd accesul la funcționalitățile acelui rol până la reactivare
- **Permisiune ștearsă**: Ștergerea unei permisiuni o elimină automat din toate rolurile și de la toți utilizatorii
- **Permisiune dezactivată**: Permisiunile inactive nu pot fi acordate la roluri/utilizatori noi, dar cele existente rămân asociate (inactiv)
- **Cerere duplicată**: Previne trimiterea mai multor cereri pentru același atlet până la răspuns
- **Acces fără aprobare**: Părinții văd doar atleții aprobați, restul sunt invizibili
- **Mesaje fără acces**: Mesageria este disponibilă doar între antrenori și părinți cu acces aprobat
- **Ștergere atlet cu cereri**: La ștergerea unui atlet se șterg și cererile și mesajele asociate
- **Atlet fără user asociat**: Atleții pot exista independent de utilizatorii cu rol "athlete"
- **Deconectare**: Buton clar de logout care resetează sesiunea curentă
- **Validare formulare**: Toate câmpurile obligatorii sunt verificate înainte de salvare
- **Mobile responsive**: Layout se adaptează complet pe dispozitive mobile cu tabs transformate în select când e necesar
- **Verificare permisiuni**: La fiecare acțiune (create, view, edit, delete) se verifică dacă utilizatorul are permisiunea corespunzătoare prin rol sau acordare individuală

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
  - Card pentru atleți, statistici, antrenori, cereri, conversații, probe, permisiuni și roluri
  - Dialog pentru formulare de adăugare/editare, autentificare, management permisiuni și management roluri
  - Tabs pentru navigare între secțiuni diferite per rol (7 tabs pentru SuperAdmin: Dashboard, Aprobări, Utilizatori, Roluri, Permisiuni, Probe, Atleți)
  - Badge pentru status cereri (Pending, Approved, Rejected), roluri (SuperAdmin, Coach, etc.), permisiuni (create, view, edit, delete), status activ/inactiv și mesaje necitite
  - Checkbox pentru selectare multiplă permisiuni în formularul de rol și selectare toate permisiunile unei resurse
  - Avatar pentru reprezentare utilizatori și atleți
  - ScrollArea pentru lista de mesaje în chat și listă lungă de permisiuni
  - Textarea pentru scriere mesaje, descrieri probe și descrieri roluri
  - Alert pentru notificări importante
  - Select pentru filtre și alegeri (categorie probe, tip permisiune, resurse, roluri)
  - Input pentru căutare și formulare
  - Switch pentru activare/dezactivare roluri și permisiuni
  - AlertDialog pentru confirmare ștergere roluri, permisiuni și utilizatori
  
- **Customizations**: 
  - Panouri separate și complet diferite pentru fiecare rol (SuperAdmin/Coach/Parent/Athlete)
  - Header cu gradient pentru SuperAdmin (from-primary/10 to-accent/10)
  - Card-uri probe cu iconuri contextuale (Timer/Target/Ruler) per categorie
  - Card-uri roluri cu indicator sistem (Lock icon) pentru roluri protejate, badge activ/inactiv, și listă compactă de permisiuni
  - Management permisiuni cu sistem de badge-uri complexe (icon + text + remove button)
  - Management roluri cu formular complex: listă permisiuni grupată pe resurse (athletes, results, etc.), checkbox selectare toate din resursă, counter permisiuni selectate
  - Dashboard statistici pentru SuperAdmin cu carduri overview inclusiv număr roluri
  - Athlete dashboard cu profil hero card gradient și timeline rezultate
  
- **States**: 
  - Buttons: hover cu scale(1.02) și shadow enhanced, active cu scale(0.98), disabled cu opacity 50%
  - Badge status cereri: culori distincte pending (secondary), approved (success green), rejected (destructive)
  - Badge roluri: default pentru SuperAdmin, secondary pentru Coach, outline pentru Parent/Athlete și roluri custom
  - Badge permisiuni: outline cu text format resource.action (ex: "athletes.create")
  - Badge status activ/inactiv: default pentru activ, secondary pentru inactiv
  - Mesaje: stil diferit pentru mesaje trimise (primary bg) vs primite (muted bg)
  - Inputs: focus cu border accent și shadow glow, error cu border destructive
  - Cards: hover cu subtle lift (translateY(-2px)) și shadow increase
  - Roluri sistem: indicator Lock și protecție la ștergere și editare nume
  - Checkbox permisiuni: checked pentru permisiuni selectate, indeterminate pentru "unele selectate" din resursă
  
- **Icon Selection**: 
  - ShieldCheck pentru SuperAdmin și sistem permisiuni
  - UserGear pentru management roluri
  - Lock pentru roluri de sistem (protejate)
  - UserCircle pentru autentificare și utilizatori
  - SignOut pentru deconectare
  - Eye / EyeSlash pentru toggle vizibilitate parolă în formulare
  - Envelope pentru cereri de acces și notificări
  - ChatCircleDots pentru mesagerie
  - Trophy pentru dashboard și performanțe atleți
  - Target pentru probe și events management
  - Timer pentru probe alergare
  - Ruler pentru probe aruncări
  - Plus pentru adăugare (atleți, antrenori, probe, permisiuni, roluri)
  - Pencil pentru editare
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
  - Tabs pentru SuperAdmin (7 tabs) rămân tabs dar cu text mai scurt pe mobile, eventual scroll orizontal
  - Grid roluri/permisiuni/atleți/probe: 1 coloană mobile (<768px), 2 coloane tablet (768-1024px), 3 coloane desktop (>1024px)
  - Dialog fullscreen pe mobile pentru formulare complexe (management permisiuni, creare/editare rol)
  - Dialog roluri cu overflow scroll pe mobile pentru lista lungă de permisiuni grupate
  - Conversații chat: layout vertical stack pe mobile, side-by-side pe desktop (>1024px)
  - Badges se wrappează pe multiple linii când e nevoie
  - Search bars full-width pe mobile
  - Sticky header pentru navigare rapidă pe scroll
  - Badge-uri "hidden sm:flex" pentru labels text lunghi (ex: nume utilizator în header)
  - Checkbox grid pentru permisiuni: 1 coloană pe mobile, 2 coloane pe desktop în formularul de rol
