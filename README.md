# Club Atletism - Management Atleți

Aplicație web pentru managementul atleților juniori din cadrul clubului de atletism.

## 🔐 Acces SuperAdmin

Pentru a accesa panoul de administrare SuperAdmin, folosește următoarele credențiale:

**Email:** `admin@clubatletism.ro`

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

## 🔧 Cum Funcționează

1. **Prima Rulare**: Contul SuperAdmin este creat automat
2. **Autentificare**: Folosește emailul `admin@clubatletism.ro` pentru acces complet
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

## 📝 Note Importante

- Aplicația folosește autentificare simplificată bazată pe email (fără parolă)
- Este proiectată pentru utilizare în medii controlate (cluburi sportive)
- Toate datele sunt stocate local în browser
- Pentru producție, se recomandă implementarea autentificării complete
