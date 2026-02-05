# SPEC.md - Kravspecifikation för Uthyrningssystem

## Affärsmodell

Uthyrning av tunga maskiner (minigrävare, dumper) samt event-objekt (mobil bastu/bastubåt på släp).

## Hyreslogik

- **Enhet:** Objekt hyrs per dygn (Date Range Picker), inte per timme.
- **Prissättning:**
  - Baspris per dygn.
  - "Stafflad prissättning" (Volymrabatt): T.ex. Dag 1: 100%, Dag 2-3: 10% rabatt, Vecka: 20% rabatt.
- **Logistik:** Vissa objekt (Bastun) kräver utkörning. Kassan måste ha fält för leveransadress.

## Kundflöde (Webb)

1. **Startsida:** Visa kategorier (Maskiner vs Event/Bastu).
2. **Produktsida:** Bilder, teknisk info, prisexempel.
3. **Bokning:**
   - Välj startdatum och slutdatum.
   - Systemet räknar ut totalpris live (inklusive rabatter).
4. **Kassa (Checkout):**
   - Fyll i kunduppgifter (Företag/Privat).
   - **VIKTIGT:** Checkbox för "Jag godkänner hyresavtalet" (Måste vara ikryssad för att knappen "Boka" ska tändas). Länk till PDF-avtal.
   - Betalning/Bokningsbekräftelse.

## Admin (CMS)

- Dashboard: Överblick över kommande uthyrningar (Kalendervy).
- Inventory: Lägga till/redigera maskiner (Namn, Bild, Dygnspris, Lagerstatus).
- Avtalshantering: Kunna ladda upp avtalstext.
