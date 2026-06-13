# Sammanfattning av appen (nuvarande tillstånd)

Underlag för kunddiskussion. Baserat på kodbasen (webbkundappen **Forshälla Alltjänst**, adminappen och API-lagret), utan implementationsdetaljer.

---

## 1. Hisspitchen

Appen är i praktiken en **uthyrningswebbplats med två spår**: entreprenadmaskiner och bastu/event, med gemensam varukorgsupplevelse i form av **datumval, prisberäkning och en kassasteg** där kunden fyller i uppgifter och går igenom **simulerad** avtalssignering och betalning. Vid sidan av det finns en **adminvy** där man kan hantera **sortiment (produkter)** mot samma backend som kundsidan, samt en **kalender** där upptagna datum kan sparas så att kunder inte kan boka då. Själva **bokningslistor, logistik och avtal i admin** är i huvudsak **utkast med demo-/mockdata** eller omdirigeringar, och en genomförd kundbokning **spareras inte** i databasen i nuläget.

---

## 2. Implementerade funktioner

- **Produktkatalog** med två kategorier (maskiner / bastu & event), hämtad från databas om den finns konfigurerad, annars från lokal JSON-fil.
- **Produktkort** med bild, beskrivning, dagspris och väg till bokning (maskiner: direktlänk; bastu: ofta via inbäddad pris-/datumväljare).
- **Boknings-/priskalkyl**: val av period, helgregler för bastu, rabatt vid längre hyra, validering mot **spärrade datum** (hämtas från API).
- **Kassa**: sammanfattning av produkt och antal dagar/totalpris; formulär för namn, org-/personnummer, e-post, telefon; **leveransadress** (med adressförslag) när produkten kräver det.
- **Hyresavtal i modal** (platshållartext) med **fejkad BankID-signering** (tidsfördröjning, ingen riktig integration).
- **Betalning i modal**: **fejkad Swish** och **fejkat kortflöde**; därefter en **bekräftelseskärm** (ingen verklig transaktion eller e-postkvitto i kod).
- **Publik API** för produkter (läs/skriv) och **spärrade datum** samt **personliga kalenderhändelser** (filer på disk, används från admin-kalender).
- **Admin – utbud**: lista, lägg till, redigera och spara produkter via webbappens produkt-API.
- **Admin – kalender**: växling mellan ”personlig” kalender och bokningsöversikt (mock); markera dagar som blockerade och synka mot webb-API; personliga händelser via API.
- **Admin – översikt, bokningar**: dashboard och bokningslista med **inbyggd exempeldata**, modal för logistikdetaljer.
- **Admin – inställningar**: bl.a. lokalt sparad växel för e-postnotis, avtalsmetadata och lista över **exempel-signatarer** (inte kopplad till riktiga kundbokningar).

---

## 3. Användarflöde (UI/UX)

### Kund (webb)

- **Startsida** (`/`): två stora ytor – Maskiner respektive Bastu & Event.
- **`/maskiner`**: listning av entreprenadprodukter; ”Hyr” ska leda mot kassa (i koden används andra query-parametrar än kassan förväntar sig, så flödet via enbart den knappen riskerar att hamna på fel sida – fullt flöde via datumväljaren på bastusidan är konsekvent).
- **`/bastu`**: listning/event-layout med **inbyggd bokningsräknare** → **`/kassa`** med `product`, `start`, `end` i URL.
- **`/kassa`**: om parametrar saknas/fel → felmeddelande; annars formulär → avtal → betalning → bekräftelse → länk hem.

### Admin

- Gemensam **layout med sidomeny**: Översikt → Bokningar → Kalender → Utbud → Inställningar.
- **`/logistics`** och **`/avtal`** **omdirigerar** till översikt respektive inställningar (inga egna vyer).

---

## 4. Datamodell

### Som faktiskt används i driftflödena idag

- **Produkter**: slug, namn, pris per dag, beskrivning, kategori (entreprenad/event), bild-URL, avtalstext, extra info, flagga för leveransbehov; lagras i **Supabase-tabellen `products`** om den är inkopplad, annars i **`apps/web/data/products.json`**.
- **Spärrade datum**: per ”admin”-id, i **`blocked-dates.json`** via API (union av alla admins används på kundsidan för att blockera datum).
- **Personliga händelser** (admin-kalender): per admin-id i **`personal-events.json`** via API.
- **Admin-only / demo**: mockade bokningar och logistik i React-state; **avtal och signatarer** delvis i **localStorage** + hårdkodade exempel i inställningar.

### Finns i databasschema (migration) men är inte kopplat till kundens kassaflöde i denna kod

- Tabeller för **`bookings`** (kund, kontakt, datum, pris, status) och **`blocked_dates`** – alltså en avsedd modell för riktiga bokningar och centralt blockerade dagar, som ännu inte driver det du ser i webbläsaren på samma sätt som JSON-filerna.

---

## Viktiga gap (för scope-/prioriteringsdialog)

- Inga riktiga **bokningar**, **betalningar** eller **BankID**.
- **Adminbokningar** är i huvudsak skissdata.
- **Spärrade datum** lever i **JSON-filer** via API, parallellt med SQL-migrationer som pekar mot annan lagring framåt.
