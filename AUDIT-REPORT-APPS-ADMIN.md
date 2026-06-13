# Teknisk audit: `apps/admin`

**Projekt:** BookingSystem (monorepo) — adminapplikation för bokningssystem / maskinuthyrning  
**Auditdatum:** 2026-05-13  
**Omfattning:** Hela katalogen `apps/admin/` (källkod, konfiguration, miljömallar). För integrationsgränser refereras kort `apps/web` där admin anropar publika API:er.  
**Metod:** Statisk genomgång av filsystem, `package.json`, TypeScript-/Next-konfiguration, alla sidor och delade komponenter, beroenden och miljövariabler. Ingen körning av byggen eller penetrationstester ingick.

---

## 1. Sammanfattning

`apps/admin` är en **fristående Next.js 15-app** (App Router) som körs på **port 3001** i utveckling. Den använder **React 19**, **Tailwind CSS 3**, **TypeScript (strict)** och har **Supabase-klientbibliotek** installerat samt en **färdig browser-klient** under `lib/supabase/`.

**Viktigt fynd:** Själva gränssnittet använder **i huvudsak hårdkodad mockdata och `localStorage`**, samt **HTTP-anrop till `apps/web`** för produkter, spärrade datum och personliga händelser. **`getSupabaseBrowserClient()` anropas inte från någon sida eller komponent** i nuvarande kodbas — databaslager via Supabase är alltså **förberett men inte inkopplat** i UI-flödena.

Admin upplevs som en **MVP/prototyp** med polerad layout men begränsad backend-koppling och ingen synlig autentisering.

---

## 2. Inventering: filer och omfattning

| Mått | Värde (exkl. `node_modules` och `.next`) |
|------|------------------------------------------|
| Ungefärligt antal filer | 23 |
| Rader kod + konfig (`.ts`, `.tsx`, `.css`, `.mjs`, `.json`) | ~2909 |
| Största moduler (rader) | `app/calendar/page.tsx` (~748), `app/inventory/page.tsx` (~487), `app/page.tsx` (~462), `app/bookings/page.tsx` (~426), `app/settings/page.tsx` (~312) |

**Katalogstruktur (logisk):**

```
apps/admin/
├── app/
│   ├── layout.tsx              # Root layout, svensk html lang
│   ├── globals.css             # Design tokens + utility-klasser
│   ├── page.tsx                # Översikt (mock + localStorage)
│   ├── bookings/page.tsx
│   ├── calendar/page.tsx
│   ├── inventory/page.tsx
│   ├── settings/page.tsx
│   ├── logistics/page.tsx      # Omdirigering → /
│   ├── avtal/page.tsx          # Omdirigering → /settings
│   └── components/
│       ├── AdminShell.tsx      # Mobilmeny-context
│       ├── AdminSidebar.tsx
│       └── AdminHeader.tsx
├── lib/supabase/client.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── vercel.json
├── next-env.d.ts
└── .env.example
```

**Saknas i `apps/admin` (jämfört med typisk produktionsadmin):** `middleware.ts`, `app/api/**`, tester (`*.test.ts`), CI-specifik konfig i appen, genererade Supabase-typer, auth-flöden.

---

## 3. Språk, ramverk och toolchain

| Område | Beskrivning |
|--------|-------------|
| **Programspråk** | TypeScript (källkod), JSON (konfig), CSS (Tailwind + `@layer`) |
| **UI-ramverk** | React 19 (`react`, `react-dom`) |
| **Applikationsramverk** | Next.js 15 (`next`), App Router (`app/`) |
| **Styling** | Tailwind CSS 3.4, PostCSS, Autoprefixer |
| **Ikoner** | `lucide-react` |
| **Pakethantering (monorepo)** | pnpm (`workspace:*` mot `@booking-system/config`) |
| **Byggorkestrering** | Turborepo (rotens `turbo.json`; admin byggs med `--filter admin`) |
| **Lint** | ESLint 9 flat config (`eslint.config.mjs`) med `next/core-web-vitals` och `next/typescript` |
| **Körtid (Node)** | Rot `package.json`: `engines.node` ≥ 20 |

**TypeScript-kompilator:** Utökar `packages/config/typescript/nextjs.json` → `base.json` med **`strict: true`**, `noUnusedLocals`, `noUnusedParameters`, `ES2022`, `moduleResolution: "Bundler"`. Appens `tsconfig` har dessutom `allowJs: true` och path alias `@/*` → repo-root för `apps/admin`.

**Observation — typer vs React-version:** `package.json` har `@types/react` och `@types/react-dom` på **18.x** medan `react`/`react-dom` är **19.x**. Bygget kan fungera (peer overlap), men det är en **versionsglidning** som bör rättas till React 19-kompatibla `@types` när de stabiliseras, eller tas bort om React 19 levererar inbyggda typer i er setup.

---

## 4. Databas och datalager

### 4.1 Avsedd plattform (Supabase / PostgreSQL)

- **Paket:** `@supabase/supabase-js` ^2.47.0  
- **Miljövariabler (`.env.example`):**  
  - `NEXT_PUBLIC_SUPABASE_URL`  
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- **Klient:** `lib/supabase/client.ts` skapar `SupabaseClient` med anon-nyckel; kommentar beskriver att **RLS med inloggad användares JWT** är tänkt efter login. Singleton i browser, ny instans per anrop på server.

### 4.2 Faktisk användning i admin just nu

| Datakälla | Användning |
|-----------|-------------|
| **Supabase / PostgreSQL** | **Ingen** från sidor/komponenter — ingen import av `getSupabaseBrowserClient` i `app/**`. |
| **localStorage** | Anteckningar (översikt), inställningar (e-postflagga, avtal), kalender (vald admin, blockerade datum som fallback), m.m. |
| **Hårdkodad mockdata** | Bokningar, logistiklistor, produktnamn i översikt/bokningar/kalender (delvis). |
| **HTTP → `apps/web`** | Se avsnitt 5. |

**Slutsats:** Admin anropar **inte** Supabase direkt. Däremot når **Utbud / `inventory`** i praktiken samma PostgreSQL-data som kundwebben **om** `apps/web` har Supabase-credentials (`getSupabase()`): då läser/skriver route handler `apps/web/app/api/products/route.ts` tabellen `products` (annars fallback till `data/products.json`). **Kalenderspärrar och personliga händelser** går via `apps/web` till **JSON-filer** (`data/blocked-dates.json`, `data/personal-events.json`), inte via migrerade Supabase-tabeller i den granskade web-koden.

Övriga adminvyer (översikt, bokningar, m.m.) använder **mockdata + localStorage** utan databas.

---

## 5. Integration mot `apps/web` (BFF-liknande gräns)

Miljövariabel **`NEXT_PUBLIC_WEB_APP_URL`** (standard i kod: `http://localhost:3000`) pekar ut **kundwebben** som admin anropar.

| Adminvy | HTTP-metod | Endpoint (relativt `NEXT_PUBLIC_WEB_APP_URL`) | Syfte |
|---------|------------|-----------------------------------------------|--------|
| `inventory/page.tsx` | GET | `/api/products` | Lista produkter (via web: Supabase `products` om konfigurerat, annars JSON-fil) |
| `inventory/page.tsx` | PUT (sparande) | `/api/products` | Body `{ products: Product[] }` — upsert till Supabase eller skriv till JSON-fil samma logik som GET |
| `calendar/page.tsx` | GET / PUT | `/api/blocked-dates` | Läs/skriv per-admin blockerade datum |
| `calendar/page.tsx` | GET / PUT | `/api/personal-events` | Personliga händelser per admin |

**Konsekvenser:** Admin kräver att **web-appen är nåbar** (samma maskin i dev, eller korrekt URL i prod). CORS hanteras på web-sidans routes (öppna headers i granskade filer). **Ingen autentisering** mellan admin och dessa API:er synlig i adminkoden — risk måste bedömas i produktion.

---

## 6. Routing och navigation

| Route | Komponent | Beteende |
|-------|-----------|----------|
| `/` | `app/page.tsx` | Översikt: mock bokningar/logistik, anteckningar i `localStorage` |
| `/bookings` | `app/bookings/page.tsx` | Tabell + sidopanel, mock state, "SMS"-copy utan riktigt SMS |
| `/calendar` | `app/calendar/page.tsx` | Månadsvy, delvis API + mock bokningar |
| `/inventory` | `app/inventory/page.tsx` | CRUD via web API |
| `/settings` | `app/settings/page.tsx` | Avtal + mock signeringslista + localStorage |
| `/logistics` | `app/logistics/page.tsx` | `router.replace("/")` |
| `/avtal` | `app/avtal/page.tsx` | `router.replace("/settings")` |

**Sidebar (`AdminSidebar.tsx`):** Länkar till `/`, `/bookings`, `/calendar`, `/inventory`, `/settings` — **inte** till `/logistics` eller `/avtal` (omdirigeringar finns för bakåtkompatibilitet eller gamla bokmärken).

---

## 7. UI/UX och tillgänglighet

- **Språk i UI:** Svenska (`lang="sv"`, texter, `toLocaleDateString("sv-SE", …)`).  
- **Layout:** Fast sidebar (desktop), off-canvas på mobil via `AdminShell`-context; sticky header.  
- **Designsystem:** CSS-variabler för färger, skuggor, radier; återanvändbara klasser (`.admin-card`, `.admin-btn-primary`, `.admin-input`, tabellhuvuden).  
- **Tailwind `content`:** `./app/**/*` och `./components/**/*` — mappen `components/` i app-root används **inte** idag (inga filer där); allt ligger under `app/components/`. **Inkonsekvens:** `tailwind.config.ts` skannar en tom/genomgång `components/`-väg — ofarligt men onödigt.  
- **A11y:** Fokusringar i `globals.css`, `aria-label` / `aria-current` på flera kontroller, dialoger med `role="dialog"` och `aria-modal` på flera ställen.

---

## 8. Säkerhet och drift (observationer)

1. **Ingen inloggning** i admin: header visar statisk text "Inloggad". Supabase Auth nämns i kommentarer men **är inte implementerad** i UI.  
2. **Publika nycklar:** Endast `NEXT_PUBLIC_*` i mall — lämpligt för klient, men utan auth exponerar ni **endast det som RLS/policy tillåter** när ni väl kopplar in Supabase.  
3. **Web API:er** som admin använder skriver till **lokala JSON-filer** på servern (i `apps/web`) — i produktion kräver det **skydd** (auth, rate limit, validering) så inte vem som helst kan PUT:a data om URL läcker.  
4. **Inga serverside secrets** i admin-appens egen kod för databas — service role används inte här (turbo `globalEnv` nämner `SUPABASE_SERVICE_ROLE_KEY` på monoreponivå för andra appar/uppgifter, inte nödvändigtvis admin).  
5. **Extern länk:** Översikt öppnar Google Maps-sök från adresssträngar (`target="_blank"`, `rel="noopener noreferrer"`) — rimligt.

---

## 9. Kodkvalitet och mönster

**Styrkor**

- Konsekvent `"use client"` på sidor som använder hooks/state.  
- Typer för lokala domänobjekt (`MockBooking`, `Product`, `PersonalEvent`, etc.) utan `any` i granskade filer.  
- `inventory` har tydlig `loading` / `error` / `saving` för fetch-flöde.

**Svagheter / teknisk skuld**

- **Duplicerad mockdata** (`MOCK_PRODUCTS`, bokningar) på flera sidor — risk för divergens.  
- **`catch` utan loggning** på flera ställen (t.ex. `localStorage`, kalender-fetch) — svår felsökning; delvis kompenserat med användarmeddelande för spärrade datum.  
- **Supabase-klient** oanvänd — död kod ur produktionssynpunkt (men menad som framtida grund).  
- **Bookings “Godkänn”** simulerar SMS med `setTimeout` — tydlig MVP-placeholder.

---

## 10. Deployment

**`vercel.json`:**  
- `installCommand`: `cd ../.. && pnpm install`  
- `buildCommand`: `cd ../.. && pnpm build --filter admin`  
- `framework`: `nextjs`  

Detta förutsätter att projektet deployas som **del av monorepon** med rot som working directory-context på Vercel (eller motsvarande).

**Utveckling:** `pnpm dev` i admin → Next på **port 3001** (`package.json` script).

---

## 11. Beroenden (runtime)

| Paket | Roll |
|-------|------|
| `next` ^15 | Framework |
| `react` / `react-dom` ^19 | UI |
| `@supabase/supabase-js` ^2.47 | DB-klient (förberedd) |
| `lucide-react` | Ikoner |

**Dev:** `tailwindcss`, `postcss`, `autoprefixer`, `typescript`, `eslint`, `eslint-config-next`, `@types/node`, `@types/react`, `@types/react-dom`, `@eslint/eslintrc`, `@booking-system/config`.

---

## 12. Rekommenderade nästa steg (prioriterat)

1. **Koppla autentisering** (t.ex. Supabase Auth) och använd `@supabase/ssr` eller motsvarande för säkra cookies om ni kör server components med session.  
2. **Ersätt mockdata** med Supabase-queries eller säkra interna API:er; centralisera typer (gärna genererade `Database`-typer från Supabase CLI).  
3. **Skydda `apps/web` API** som muterar data — admin-specifik secret header eller session-cookie validerad på servern.  
4. **Rensa eller använd** `lib/supabase/client.ts` — undvik oanvända beroenden om ni pausar Supabase i admin.  
5. **Alignera `@types/react`** med React 19-strategi.  
6. **Tailwind `content`:** inkludera endast `app/components` eller lägg delade komponenter under den sökta sökvägen.

---

## 13. Appendix A — NPM-scripts (`apps/admin`)

| Script | Kommando |
|--------|----------|
| `dev` | `next dev --port 3001` |
| `build` | `next build` |
| `lint` | `next lint` |
| `clean` | `rm -rf .next` |

---

## 14. Appendix B — Miljövariabler (`.env.example`)

| Variabel | Syfte |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-projekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publik anon-nyckel (RLS) |
| `NEXT_PUBLIC_WEB_APP_URL` | Bas-URL till `apps/web` för API-anrop |

---

*Rapporten speglar enbart tillståndet i källkoden vid granskningstillfället. För full säkerhets- eller prestandaaudit krävs dynamiska tester, hotanalys och infrastrukturreview.*
