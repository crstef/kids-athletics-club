# ✅ 2025-11-06 – Issues Resolved

1. **React error #185 for athlete registrations** – fixed by guarding the public athlete fetch effect; no more render loop when switching coaches during signup.
2. **SuperAdmin athlete creation missed profile data** – admin form now mirrors the public registration flow and creates the athlete profile + coach link automatically.
3. **Parent accounts created via SuperAdmin lacked child linkage** – admin flow now requests coach + child and stores the relationship just like self-registration.
4. **Role permission toggles had no effect** – diffing logic updated; checking/unchecking permissions now persists grants/revokes as expected.

**Heads-up:** Accounts created before these fixes do not contain the new relationship data; recreate them from *Utilizatori → Adaugă utilizator* to align with the current schema.

# ✅ 2025-11-07 – Dashboard Polish

1. **Recorduri Personale Recente layout** – widget now keeps the athlete name, proba, and data în aceeași linie, cu date formatate RO și cardul se micșorează la conținut (fără spații goale).
2. **Rezultate Recente** – fiecare intrare afișează data rezultatului în eticheta principală, armonizat cu widgetul de recorduri.
3. **Dashboard grid auto-height** – layout-ul principal nu mai forțează înălțimi egale pe rânduri, eliminând spațiile verticale dintre widgeturi.