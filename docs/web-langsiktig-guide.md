# Web-appen — riktlinjer för långsiktig produkt

**Syfte:** En levande checklista för `apps/web` — vad som ska byggas, i vilken ordning, och *hur* (prestanda, kostnad, databas, felhantering). Uppdatera filen när beslut tas eller nya mönster införs.

**Mål:** Tåla tusentals samtidiga besökare och hundratals bokningar per månad utan omskrivningar. Phase 1 undviker BankID och avancerade integrationer, men arkitekturen ska vara redo för dem.

---

## 1. Grundprinciper (gäller all ny kod i web)

| Princip | Praktisk regel |
|--------|----------------|
| **Backend-first** | Datamodell, index, constraints och API *före* större UI. UI ska inte “gissa” affärsregler. |
| **Explicit data** | Inga `.select('*')` på listor. Alltid kolumnlista + filter + `limit` där det passar. |
| **Fail loud** | Inga tomma `catch {}`. Logga med kontext (`bookings:create`, `blocked-dates:GET`) och returnera tydligt fel till klient. |
| **DB som sista domare** | Applikationsvalidering för UX; **constraints/index/triggers** för race conditions och dataintegritet. |
| **Bytbarhet** | Avtal/BankID via `AgreementVerification` + config — inte hårdkodat i kassa-komponenter. |
| **Inga platshållare** | Halvfärdiga stubbar i produktion skapar teknisk skuld som kostar mer än att göra rätt direkt. |

Se även `.cursor/rules/forshalla-alltjanst-phase1-architect.mdc`.

---

## 2. Nuvarande läge (kort)

| Område | Status |
|--------|--------|
| Startsida + produktkatalog | Supabase (fallback `data/products.json`) |
| Bokning `/boka/[slug]` | Fyrstegs-wizard: datum → uppgifter → avtal → Stripe |
| Betalning | Stripe Auth & Capture (`capture_method: manual`) |
| Avtal | Checkbox (`terms_acceptance`); BankID-redo (`eid_signature`) |
| Blockerade datum | `GET /api/blocked-dates?from=&to=` |
| Dubbelbokning | App-koll + DB EXCLUDE constraint (migration `20260602140000`) |
| Mejl | Resend via webhook/admin (ej direkt från web vid bokning) |

**Env som web måste ha i prod** (`apps/web/.env.example`):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `NEXT_PUBLIC_SUPABASE_URL` — bilder från Storage
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_*` — om mejl triggas från web senare

**Viktigt:** Service role ska matcha samma Supabase-projekt som `SUPABASE_URL`. Fel projekt/nyckel ger tysta 503/500 i API.

---

## 3. Prioriterad roadmap — vad som ska läggas till i web

### Fas A — Stabilitet före fler features (gör först)

- [ ] **`.env.local` / Vercel env** — verifiera att alla nycklar pekar på samma Supabase-projekt.
- [ ] **Kör alla migrationer** — `supabase db push` inkl. overlap + agreement verification.
- [ ] **E2E-test av bokningsflöde** — manuellt + ev. Playwright: `/` → `/boka/[slug]` → Stripe testkort → webhook → admin bekräftelse.
- [ ] **Stripe webhook i prod** — endpoint `/api/webhooks/stripe`, signaturverifiering, idempotens (samma event två gånger ska vara harmlöst).
- [ ] **Rensa `/kassa`-beroende** — redirect finns; ta bort död kod när inget länkar dit.
- [ ] **Genererade Supabase-typer** — `supabase gen types` → delat paket; sluta duplicera row-shapes.

### Fas B — Prestanda & kostnad (låg insats, hög effekt)

- [ ] **Cache produktlistor** — `getProducts()` i Server Components med `unstable_cache` eller Next `fetch` cache + `revalidateTag` vid admin-uppdatering.
- [ ] **ISR/revalidate för `/` och `/boka/[slug]`** — t.ex. `revalidate: 60` sekunder; tag-invalidering från admin vid produktändring.
- [ ] **Blockerade datum — alltid med intervall** — klienten skickar `from`/`to` (t.ex. idag → +18 mån). Aldrig hämta hela tabellen.
- [ ] **Bilder via Supabase Storage + `next/image`** — rätt `sizes`, WebP/AVIF; undvik stora original i listvy.
- [ ] **Rate limiting på `POST /api/bookings`** — Vercel middleware, Upstash Redis eller Supabase Edge Function; skyddar Stripe + DB mot missbruk.

### Fas C — Skalbar bokningsmotor

- [ ] **Tillgänglighets-API** — `GET /api/products/[slug]/availability?from=&to=` som returnerar upptagna/blockerade dagar i ett intervall (en query, inte N+1).
- [ ] **Atomisk bokning** — vid behov: Postgres RPC `create_booking()` som kör overlap-koll + insert i samma transaktion (EXCLUDE fångar race redan idag).
- [x] **Utgångna pending-bokningar** — `GET /api/cron/expire-pending-bookings` (Vercel cron, `CRON_SECRET`); avbryter `status=pending` + `payment_status=pending` äldre än `PENDING_BOOKING_EXPIRY_HOURS` (default 24h).
- [ ] **Prisberäkning endast server-side** — klient visar estimat; `total_price` i DB ska alltid räknas i `createBooking` (redan så — behåll).

### Fas D — eID / BankID (när kund beslutar)

- [ ] Byt `ACTIVE_AGREEMENT_VERIFICATION_METHOD` till `eid_signature`.
- [ ] Implementera provider (t.ex. Scrive eSign API) i `AgreementVerificationStep`.
- [ ] Implementera `assertEidSignatureVerified()` server-side — verifiera signatur mot provider *innan* PaymentIntent skapas.
- [ ] Spara `agreement_verification_ref` (`provider:externalId`) — redan i schema.

### Fas E — Observability & drift

- [ ] **Strukturerad loggning** — `requestId`, `bookingId`, `productId` i API-fel.
- [ ] **Health endpoint** — `/api/health` (DB ping, Stripe nåbar).
- [ ] **Sentry eller liknande** — frontend + API routes (gratis tier räcker länge).
- [ ] **Admin synlighet** — visa `payment_status`, verifieringsmetod, Stripe PI-id (redan delvis i admin).

---

## 4. Databas — queries & indexering

### 4.1 Tabellöversikt (web-relevant)

| Tabell | Web läser | Web skriver |
|--------|-----------|-------------|
| `products` | Ja (aktiva produkter) | Nej (admin) |
| `bookings` | Indirekt (overlap-koll) | Ja (`POST /api/bookings`) |
| `blocked_dates` | Ja (intervall) | Nej (admin) |

### 4.2 Query-mönster (rätt vs fel)

```typescript
// DÅLIGT — full scan, onödig data
await supabase.from("products").select("*");
await supabase.from("blocked_dates").select("*");

// BRA — explicit, filtrerat
await supabase
  .from("products")
  .select("slug, name, price_per_day, description, category, image, agreement, info, requires_delivery")
  .eq("is_active", true)
  .order("slug");

await supabase
  .from("blocked_dates")
  .select("date")
  .gte("date", from)
  .lte("date", to)
  .order("date", { ascending: true });
```

### 4.3 Index som ska finnas / underhållas

| Tabell | Index | Varför |
|--------|-------|--------|
| `products` | PK `slug`, ev. `(is_active, slug)` | Listor filtrerar på `is_active` |
| `bookings` | `(product_id)`, `(start_date)`, `(status)` | Admin-listor, filter |
| `bookings` | **GiST** `(product_id, booking_range)` + EXCLUDE | Dubbelbokning race-safe |
| `blocked_dates` | UNIQUE `(date)` | Lookup per dag |

Vid nya filter i admin/kund — lägg migration *innan* tabellen växer: `EXPLAIN ANALYZE` i Supabase SQL Editor.

### 4.4 Constraints (affärsregler i DB)

Redan infört eller planerat:

- `bookings_date_range` — `end_date >= start_date`
- `bookings_no_active_overlap` — inga överlappande aktiva bokningar per produkt
- `bookings_agreement_verification_method_check` — `terms_acceptance` \| `eid_signature`
- `bookings_payment_status_check` — Stripe-livscykel

**Aktiv bokning** (blockerar datum): `status IN ('pending','confirmed')` och `payment_status IN ('pending','requires_capture','succeeded')`.

### 4.5 RLS & service role

Web API använder **service role** (bypass RLS). Det innebär:

- All auktorisation sker i **applikationskod** (validering, rate limits).
- Exponera aldrig service role till klienten.
- Admin använder anon + JWT — håll rollerna separata.

---

## 5. Prestanda (web + Next.js)

### Server vs klient

| Data | Var | Cache |
|------|-----|-------|
| Produktlista, produktdetalj | Server Component | Ja (60s–300s) |
| Blockerade datum | Client fetch till eget API | Kort cache (1–5 min) per intervall |
| Bokning/betalning | Client wizard + `POST /api/bookings` | Ingen cache |

### Next.js

- **Undvik** stora `"use client"`-träd på `/` — behåll katalog som RSC.
- **`dynamic = 'force-static'`** där innehåll sällan ändras; **`revalidate`** för produkter.
- **`next/image`** för alla produktbilder — minskar bandbredd och LCP.

### API-design

- **En request per steg**, inte chatter: t.ex. inte hämta hela produktlistan i kassan om slug redan är känd.
- **Paginering** när bokningshistorik exponeras till kund (Phase 2+) — `.range(from, to)` + index.

---

## 6. Kostnader (typisk drift Phase 1 → tillväxt)

| Tjänst | Gratis tier räcker till | Kostnadsdrivare | Håll nere |
|--------|-------------------------|-----------------|----------|
| **Vercel** | Måttlig trafik | Serverless invocation, bandwidth | Cache RSC, optimera bilder |
| **Supabase** | Liten DB, låg egress | DB-storlek, egress, Storage | Intervall-queries, index, rensa gamla rader |
| **Stripe** | — | Per transaktion | Undvik onödiga PI skapade vid spam (rate limit *före* PI) |
| **Resend** | Tusentals mejl/mån | Mejl per bokning | Skicka bara vid state change (webhook/admin) |

**Stripe Auth & Capture:** skapa PaymentIntent först *efter* validerad bokning i DB (nuvarande flöde). Överväg att flytta PI-skapande till *efter* lyckad insert men *före* klient betalar — redan så.

**Framtida optimering:** skapa PI först när användaren klickar “Betala”, inte tidigare (redan så); avbryt PI om användaren lämnar sidan (cron som städar `pending` utan PI).

---

## 7. Felhantering — standard i web

### API routes (`apps/web/app/api/**`)

1. Validera input tidigt → `400` med `{ error: "..." }` (svenska meddelanden OK i UI-lager).
2. Konfigurationsfel (saknar env) → `503` + logg på server.
3. Oväntade fel → `500` generiskt till klient, detaljer i logg.
4. Kända affärsfel (upptaget datum, ändrat avtal) → `400` med specifikt meddelande.

```typescript
// Mönster
try {
  // ...
} catch (e) {
  const message = e instanceof Error ? e.message : "Unknown error";
  console.error("bookings:POST", message, e);
  // mappa kända message → 400, resten → 500
}
```

### Klient (wizard/kassa)

- Visa `role="alert"` för fel användaren kan agera på.
- Nätverksfel: “Försök igen” — inte tyst reset.
- Stripe: visa `error.message`; logga inte kortdata.

### Webhook (`/api/webhooks/stripe`)

- Verifiera signatur alltid.
- Idempotent hantering: uppdatera bara om nytt state.
- Returnera `200` snabbt; tunga jobb (mejl) kan köas senare om volym växer.

### Postgres-felkoder att hantera

| Kod | Betydelse | Klientmeddelande |
|-----|-----------|------------------|
| `23P01` | EXCLUDE overlap | “Datumen är inte längre lediga” |
| `23505` | UNIQUE | Kontextberoende |
| `23503` | FK violation | “Produkten finns inte” |

---

## 8. Säkerhet (kort checklista)

- [ ] Rate limit på `POST /api/bookings` och webhook-skydd.
- [ ] Validera alla fält (längd, e-post, datumformat) server-side — redan i `validateCreateBookingInput`.
- [ ] Jämför avtalssnapshot mot serverns `resolveAgreementText` — redan implementerat.
- [ ] CORS på publika GET — begränsa `Access-Control-Allow-Origin` i prod till kända domäner (inte `*` om admin anropar från annan origin).
- [ ] Inga secrets i `NEXT_PUBLIC_*`.
- [ ] BankID/eID: verifiera signatur **server-side** — lita aldrig på klientens `verification`-objekt utan provider-callback.

---

## 9. Testning — minimum innan release

Kör detta manuellt (eller automatisera) vid varje större web-ändring:

1. **Produktlista** — `/` laddar, bilder, priser från Supabase.
2. **Boka** — `/boka/minigravare` (eller annan slug): alla fyra steg.
3. **Blockerat datum** — admin blockerar dag → kund ser fel → kan inte gå vidare.
4. **Dubbelbokning** — två parallella bokningar samma datum → en ska faila.
5. **Stripe** — testkort, `requires_capture`, webhook uppdaterar `payment_status`.
6. **Admin** — bekräfta bokning → capture; avbryt → cancel/refund enligt implementation.
7. **Mobil** — wizard och Stripe Elements på smal skärm.
8. **Legacy URL** — `/kassa?product=...` redirectar till `/boka/...`.

---

## 10. Fil- & modulstruktur (rekommenderad)

```
apps/web/
├── app/
│   ├── page.tsx                 # RSC, produktlista
│   ├── boka/[slug]/page.tsx     # RSC + BookingWizard (client)
│   └── api/
│       ├── bookings/route.ts    # POST — enda skrivvägen för kundbokning
│       ├── blocked-dates/route.ts
│       └── webhooks/stripe/route.ts
├── lib/
│   ├── bookings.ts              # Validering + createBooking
│   ├── booking-verification.ts  # Avtal/BankID-abstraktion
│   ├── booking-config.ts        # Aktiv verifieringsmetod
│   ├── blocked-dates.ts         # DB-queries
│   └── products-data.ts         # Läs produkter (cache här)
└── components/booking/          # Wizard, avtal, steg-indikator
```

**Lägg ny affärslogik i `lib/`**, inte i page-komponenter. **En** route för kundbokning — undvik duplicerade POST-vägar.

---

## 11. Anti-mönster (gör inte detta)

| Anti-mönster | Varför |
|--------------|--------|
| Pris/total från klienten till API | Manipulation — räkna alltid server-side |
| `select('*')` på växande tabeller | Minne, egress, långsamma listor |
| Hämta alla `blocked_dates` | Onödig data när tabellen växer |
| Bokning utan overlap-koll i DB | Race vid samtidiga kunder |
| BankID i UI utan server-verifiering | Juridiskt ogiltigt / säkerhetshål |
| Static `PRODUCTS` i kassa | Driftar från Supabase — använd `products-data` |
| Tyst `catch {}` | Omöjlig felsökning i prod |

---

## 12. När ska detta dokument uppdateras?

- Ny API-route eller tabell → sektion 4 + 10.
- Nytt index/migration → sektion 4.3.
- BankID/leverantör vald → sektion 3 Fas D + 8.
- Prestandaproblem i prod → sektion 5 + `EXPLAIN ANALYZE`-resultat i PR/commit.

**Relaterade filer:** `dev_deployment.md`, `docs/codebase-analysis.md`, `docs/web-roadmap.md`, `supabase/migrations/`, `.cursor/rules/forshalla-alltjanst-phase1-architect.mdc`.
