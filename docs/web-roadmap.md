# Web-appen — produktroadmap

**Syfte:** Beskriva *vad* kundwebben ska göra, *hur* den ska fungera för användaren, och i vilken ordning vi bygger. Följ denna fil när du implementerar features; följ [`web-langsiktig-guide.md`](./web-langsiktig-guide.md) för *hur* du bygger robust (DB, prestanda, felhantering).

**Scope:** Phase 1 (MVP) — maskinuthyrning online. Bastu/event kan aktiveras senare. BankID/eID planeras men ingår inte i MVP.

**Statusnyckel:** ✅ Klart · 🟡 Påbörjat · ⬜ Planerat · 🔮 Phase 2+ · ❌ Avvecklas

---

## 1. Vision — hur sidan ska kännas

Kunden ska kunna:

1. Hitta rätt maskin på startsidan  
2. Välja hyresperiod och se pris direkt  
3. Fylla i uppgifter och godkänna hyresvillkor  
4. Reservera belopp på kort (debitering först när vi godkänt)  
5. Få bekräftelse via e-post när bokningen hanteras i admin  

**Ton:** Enkel, tydlig, förtroendeingivande — inga tekniska termer i UI. Allt på svenska.

**Relaterade filer för texter/tema:** `apps/web/theme/site-content.ts`, `apps/web/theme/site-theme.css`

---

## 2. Sidkarta

| Route | Syfte | Status |
|-------|--------|--------|
| `/` | Startsida: hero, så funkar det, maskinkatalog, kontakt | ✅ |
| `/boka/[slug]` | Huvudflöde: datum → uppgifter → avtal → betalning | ✅ |
| `/kassa` | Legacy — redirect till `/boka/[slug]` | 🟡 (redirect klar; rensa kod) |
| `/maskiner` | Legacy — redirect till `/` | ✅ |
| `/bastu` | Bastu/event (egen layout + helgregler) | 🔮 Phase 2 — sidan finns men är inte länkad från `/` |
| **API** | | |
| `POST /api/bookings` | Skapa bokning + Stripe PaymentIntent | ✅ |
| `GET /api/blocked-dates` | Blockerade dagar (med `from`/`to`) | ✅ |
| `GET /api/products` | Produktlista (admin + fallback) | ✅ |
| `POST /api/webhooks/stripe` | Uppdatera betalningsstatus, trigga mejl | ✅ |

---

## 3. Användarflöden (detaljer)

### 3.1 Huvudflöde — maskinuthyrning

```mermaid
flowchart LR
  A[Startsida /] --> B[Välj maskin]
  B --> C[/boka/slug]
  C --> D[Steg 1: Datum]
  D --> E[Steg 2: Uppgifter]
  E --> F[Steg 3: Avtal]
  F --> G[Steg 4: Stripe]
  G --> H[Bekräftelsesida]
  H --> I[Admin granskar]
  I --> J{Godkänd?}
  J -->|Ja| K[Capture + mejl]
  J -->|Nej| L[Cancel/refund + mejl]
```

**Steg 1 — Datum**

- Kund väljer start- och slutdatum  
- System visar antal dygn, ev. mängdrabatt (>3 dygn, 15 %)  
- Blockerade datum (admin kalender) ska inte gå att boka  
- Upptagna datum (befintlig bokning samma maskin) ska inte gå att boka  
- Knapp: *Fortsätt*

**Steg 2 — Uppgifter**

- Företagsnamn / namn  
- Org-/personnummer  
- E-post, telefon  
- Meddelande (valfritt)  
- Leveransadress (obligatoriskt om produkten kräver utkörning)  
- Knapp: *Fortsätt*

**Steg 3 — Avtal**

- Läs hyresvillkor (modal) — text från produktens `agreement` i Supabase  
- Godkänn via checkbox (MVP)  
- Senare: BankID/eID-signering (samma steg, annan UI)  
- Knapp: *Fortsätt till betalning*

**Steg 4 — Betalning**

- Sammanfattning: produkt, datum, totalpris  
- Stripe Elements — belopp **reserveras** (manual capture)  
- Efter lyckad auth: bekräftelsesida (*Betalning reserverad — vi återkommer*)  
- Webhook sätter `payment_status: requires_capture` och skickar *bokning mottagen*-mejl  

**Efter betalning (admin, inte web)**

- Admin bekräftar → Stripe capture → `confirmed` + bekräftelsemejl  
- Admin avbryter → cancel/refund → `canceled` + meddelande till kund  

### 3.2 Alternativa ingångar

| Ingång | Beteende | Status |
|--------|----------|--------|
| Produktkort *Boka* | `/boka/[slug]` (datum väljs i wizard) | ✅ |
| Kalkylator med valda datum | `/boka/[slug]?start=&end=` → hoppar till steg 2 | ✅ |
| Gammal `/kassa?product=` | Redirect till `/boka/` | ✅ |

### 3.3 Bastu/event (Phase 2)

- Egen landning eller sektion på `/`  
- **Helg-only** bokning (fre–sön) via `BookingCalculator`  
- Leverans obligatoriskt  
- Samma `/boka/[slug]`-motor — produktregler styrs i DB (`requires_delivery`, ev. framtida `weekend_only`-flagga)  

---

## 4. Funktionslista — roadmap per område

### 4.1 Innehåll & presentation

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-01 | Startsida hero | Rubrik, intro, CTA mot maskiner | ✅ |
| W-02 | Så funkar det | 3 steg (välj → boka → leverans) | ✅ |
| W-03 | Maskinkatalog | Grid med kort från Supabase (`entreprenad`) | ✅ |
| W-04 | Produktkort | Bild, namn, pris/dygn, kort beskrivning, Boka | ✅ |
| W-05 | Kontaktsektion | E-post, telefon, adress från `site-content` | ✅ |
| W-06 | Header/footer | Enhetlig navigation, varumärke | ✅ |
| W-07 | SEO/metadata | `title`, `description` per sida | 🟡 (startsida klar) |
| W-08 | Produktbilder Storage | Bilder från Supabase Storage, `next/image` | ✅ |
| W-09 | Tomt tillstånd | *Inga maskiner* om katalogen är tom | ✅ |
| W-10 | Bastu-sektion | Egen sida/kategori | 🔮 |

### 4.2 Bokning & prissättning

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-20 | Bokningswizard | 4 steg på `/boka/[slug]` | ✅ |
| W-21 | Datumval | Datepicker + blocked dates | ✅ |
| W-22 | Prisberäkning | Dygn × dagspris, mängdrabatt | ✅ |
| W-23 | Blockerade datum | Admin-blockering → API → kalender | ✅ |
| W-24 | Dubbelbokningsskydd | Overlap-koll + DB constraint | ✅ |
| W-25 | Leveransadress | Autocomplete när `requires_delivery` | ✅ |
| W-26 | Server-side pris | Total räknas i API, inte från klient | ✅ |
| W-27 | Availability-API | En endpoint: lediga/upptagna dagar per produkt | ✅ |
| W-28 | Utgångna obetalda | Auto-cancel pending efter X timmar | ✅ |
| W-29 | Helg-only regler | Bastu: endast fre–sön | 🔮 (kalkylator finns) |

### 4.3 Avtal & eID

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-30 | Hyresvillkor modal | Text per produkt (mall eller inline) | ✅ |
| W-31 | Checkbox-godkännande | Tidsstämpel + snapshot sparas i DB | ✅ |
| W-32 | Verifieringsabstraktion | `terms_acceptance` / `eid_signature` | ✅ |
| W-33 | BankID/Scrive | Popup-signering + server-verifiering | 🔮 |
| W-34 | Avtal vid ändring | Fel om admin ändrat text efter godkännande | ✅ |

### 4.4 Betalning

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-40 | Stripe Elements | Kortbetalning i wizard | ✅ |
| W-41 | Auth & Capture | Reservera nu, debitera vid admin OK | ✅ |
| W-42 | Webhook | `requires_capture`, mejl vid mottagen bokning | ✅ |
| W-43 | Minimumbelopp | Stripe minimum (3 kr) valideras | ✅ |
| W-44 | Swish | — | ❌ Phase 1 (Stripe räcker) |
| W-45 | Kvitto/PDF | Nedladdningsbart kvitto | 🔮 |

### 4.5 Mejl & kommunikation

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-50 | Bokning mottagen | E-post när betalning auktoriserats | ✅ (via webhook) |
| W-51 | Bokning bekräftad | E-post när admin capture:ar | ✅ (admin) |
| W-52 | Bokning avbruten | E-post vid cancel | ✅ (admin) |
| W-53 | SMS-påminnelser | — | 🔮 |

### 4.6 Drift, kvalitet & säkerhet

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| W-60 | Env i prod | Supabase + Stripe korrekt konfigurerat | 🟡 (lokalt klart) |
| W-61 | E2E-test checklista | Se §6 | 🟡 (mejl klara; T-09 mobil + T-04 webbläsare kvar) |
| W-62 | Rate limiting | Skydd av `POST /api/bookings` | ✅ |
| W-63 | Cache produkter | ISR/revalidate vid admin-ändring | ✅ |
| W-64 | Error tracking | Sentry el.l. | 🔮 |
| W-65 | `/kassa` rensad | Bara redirect, ingen duplicerad logik | ✅ |

---

## 5. Byggordning — följ denna sekvens

Prioriterad ordning så varje steg bygger på föregående. Kryssa av i denna fil när klart.

### Sprint 1 — Kärnflöde fungerar end-to-end ✅ (largest part done)

- [x] W-01–W-06 Startsida & tema  
- [x] W-20–W-26 Bokningswizard + DB  
- [x] W-30–W-32, W-34 Avtal  
- [x] W-40–W-43 Stripe  
- [x] W-23–W-24 Tillgänglighet  

### Sprint 2 — Stabil produktion 🟡 (pågår)

- [x] W-60 Env lokalt — `apps/web/.env.local` skapad; service role matchar `hctwdgjzvvgdtfbwnmnn` (root `.env` rättad)
- [x] W-60 Migrationer — `supabase db push`: remote up to date
- [ ] W-60 Env i prod (Vercel) — samma nycklar som lokalt *(väntar på lanseringsbeslut §11)*
- [x] W-61 T-05 webhook — `requires_capture` via `stripe listen` + API (2026-06-13)
- [x] W-61 T-06 capture — Stripe capture + `confirmed`/`succeeded` i DB (2026-06-13)
- [x] W-61 Mejl mottagen — Resend + webhook E2E till `linusilbratt@gmail.com` (2026-06-13)
- [x] W-61 Mejl bekräftelse — admin confirm + `BookingConfirmedEmail` (2026-06-13)
- [x] W-65 `/kassa` — endast redirect till `/boka/`
- [x] W-62 Rate limiting — `POST /api/bookings` (8/min per IP)
- [x] W-63 Cache produkter — `unstable_cache` 60s + `revalidate` på `/` och `/boka/[slug]`
- [x] W-07 SEO — `generateMetadata` på `/boka/[slug]`

### Sprint 3 — Robust bokningsmotor 🟡 (pågår)

- [x] W-27 Availability-API — `/api/availability?productId=&from=&to=` (2026-06-13)
- [x] W-28 Auto-cancel utgångna pending — cron `/api/cron/expire-pending-bookings` (2026-06-13)
- [x] W-08 Bilder — `resolveProductImageUrl` + `next/image` (Storage-redo)

### Sprint 4 — Utökning 🔮

- [ ] W-10, W-29 Bastu/event aktivt på sajten  
- [ ] W-33 BankID/eID  
- [ ] W-45 Kvitto  
- [ ] W-53 SMS  

---

## 6. Acceptanstest — kör innan “klar för kund”

| # | Test | Förväntat resultat |
|---|------|-------------------|
| T-01 | Öppna `/` | Maskiner visas, inga konsolfel |
| T-02 | Klick *Boka* | `/boka/[slug]` steg 1 |
| T-03 | Välj datum med blockering | Felmeddelande, kan inte fortsätta |
| T-04 | Genomför alla steg + Stripe testkort | Bekräftelsesida, rad i `bookings` |
| T-05 | Webhook | `payment_status: requires_capture`, mejl skickat |
| T-06 | Admin bekräftar | Capture, status `confirmed` |
| T-07 | Dubbelbokning samma datum | Andra försöket nekas |
| T-08 | `/kassa?product=x&start=&end=` | Redirect till `/boka/x?...` |
| T-09 | Mobil (375px) | Wizard och betalning användbar |
| T-10 | Saknad env lokalt | Tydligt fel i API, inte vit skärm |

---

## 7. Definition of Done — per web-feature

En feature räknas som **klar** när:

1. **Funktion** matchar beskrivningen i §3–§4  
2. **Server validerar** all input (inte bara klient)  
3. **Fel** visas tydligt för användaren; loggas på server  
4. **DB** har rätt index/constraints om feature skriver data  
5. **Test** från §6 som berör featuren är grön  
6. **Ingen** duplicerad affärslogik (en källa: `lib/`)  
7. **Dokument** — status uppdaterad i denna fil  

---

## 8. Vad som medvetet inte ingår i Phase 1

| Feature | Anledning |
|---------|-----------|
| BankID | Kräver leverantörsavtal; arkitektur förberedd |
| Swish direkt | Stripe räcker MVP |
| Kundinlogg | Bokningar kopplas till e-post, inte konto |
| Bokningshistorik i web | Admin hanterar; kund får mejl |
| Faktura/efaktura | Manuellt eller Phase 2 |
| Flera produkter i samma order | En maskin per bokning i MVP |

---

## 9. Koppling till admin

Web **läser** det admin **skriver**:

| Admin | Web-effekt |
|-------|------------|
| Produkter (utbud) | Katalog + pris + avtal + bild |
| Blockerade datum (kalender) | Ej bokningsbara dagar |
| Bekräfta/avbryt bokning | Capture/cancel + mejl |

Web ska **inte** duplicera admin-funktioner (redigera produkter, se alla bokningar).

---

## 10. Lanseringsbeslut — checkbox vs BankID

**Strategi (2026-06-13):** Fortsätt bygga kärnflödet (bokning, betalning, admin, mejl, tillgänglighet). BankID påverkar **endast avtalssteget** — byt `ACTIVE_AGREEMENT_VERIFICATION_METHOD` när leverantör är vald. Pausa **prod-deploy och domän-mejl** tills affärsbeslut är taget.

### Go live med checkbox (MVP)

| Krav | Status |
|------|--------|
| Juridiskt OK att hyra med checkbox + villkorssnapshot | ⬜ **Beslut krävs (kund/jurist)** |
| Resend med verifierad avsändardomän | ⬜ |
| Vercel env (web + admin) + Stripe prod webhook | ⬜ |
| T-04, T-09 acceptanstest gröna | ⬜ |
| Admin kan bekräfta/avbryta + mejl fungerar | ✅ |

### Go live med BankID först

| Krav | Status |
|------|--------|
| Leverantör vald (Scrive/Freja/etc.) + avtal | ⬜ |
| `eid_signature` implementerat + server-verifiering | ⬜ |
| Övriga MVP-krav ovan | ⬜ |

### Teknik som inte väntar på BankID-beslut

- Dubbelbokningsskydd, rate limit, webhook, Stripe capture  
- Transaktionsmejl (mottagen + bekräftelse)  
- Auto-cancel utgångna obetalda bokningar (W-28)  
- Availability-API (W-27)

**Nästa affärsbeslut:** Får kunder boka online med checkbox tills BankID finns? Svar styr om W-60 prod deploy startar.

---

## 11. Underhåll av roadmapen

| När | Gör |
|-----|-----|
| Ny feature beslutad | Lägg rad i §4 med ID (W-XX), status ⬜ |
| Feature implementerad | Sätt ✅, kryssa Sprint-checkbox |
| Scope skjuts upp | Byt till 🔮 med kort motivering |
| Tekniskt beslut | Detaljer i `web-langsiktig-guide.md`, inte här |

**Filer att hålla synkade:**

- `docs/web-roadmap.md` — denna fil (produkt & flöden)  
- `docs/web-langsiktig-guide.md` — teknik, DB, prestanda  
- `apps/web/theme/site-content.ts` — kundtexter  
- `.cursor/rules/forshalla-alltjanst-phase1-architect.mdc` — AI-regler: kvalitet före hastighet, best practice, länkar till roadmap/guide  

---

*Senast uppdaterad utifrån kodbasen maj 2026. `summering.md` är föråldrad — använd denna fil som sanningskälla för web.*
