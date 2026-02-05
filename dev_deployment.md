# Deployment Guide – Bokningssystem

Guide för att deploya kundappen (`web`) och adminappen (`admin`) så att kunder kan använda båda. Allt är **gratis** och kräver ingen domän.

## Översikt

- **Kod:** Supabase- och Vercel-integrationen finns redan i projektet.
- **Frontend:** Vercel (gratis) för båda Next.js-apparna.
- **Data:** Supabase (gratis) för produktdata. Lokalt används `data/products.json` om Supabase inte är konfigurerat.

## Förutsättningar

- GitHub-konto
- Vercel-konto – [vercel.com](https://vercel.com)
- Supabase-konto – [supabase.com](https://supabase.com)

---

## Steg 1: GitHub

1. Skapa ett nytt repository på GitHub.
2. Pusha koden:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/booking-system.git
git push -u origin main
```

---

## Steg 2: Supabase

### 2.1 Skapa projekt

1. Gå till [supabase.com](https://supabase.com) och skapa ett nytt projekt.
2. Öppna **SQL Editor**.

### 2.2 Kör schema och seed

1. Kör först **`supabase/schema.sql`** (skapar tabellen `products` och RLS).
2. Kör sedan **`supabase/seed.sql`** (lägger in produkterna som i `data/products.json`).

### 2.3 Hämta nycklar

1. Gå till **Project Settings → API**.
2. Kopiera:
   - **Project URL** → används som `SUPABASE_URL`
   - **service_role** (secret key) → används som `SUPABASE_SERVICE_ROLE_KEY`

---

## Steg 3: Vercel – Web (kundapp)

1. Logga in på [vercel.com](https://vercel.com) med GitHub.
2. **Add New Project** → välj ditt repo.
3. Konfigurera:
   - **Root Directory:** `apps/web` (viktigt).
   - **Framework Preset:** Next.js (förvalt).
   - `vercel.json` i `apps/web` sätter redan `installCommand` och `buildCommand` för monorepon.
4. **Environment Variables** (Settings → Environment Variables):
   - `SUPABASE_URL` = Project URL från Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role-nyckeln från Supabase
5. **Deploy**. Spara den genererade URL:en (t.ex. `xxx-web.vercel.app`).

---

## Steg 4: Vercel – Admin

1. **Add New Project** igen → samma repo.
2. Konfigurera:
   - **Root Directory:** `apps/admin`.
   - **Framework Preset:** Next.js.
3. **Environment Variables:**
   - `NEXT_PUBLIC_WEB_APP_URL` = URL:en till web-appen från Steg 3 (t.ex. `https://xxx-web.vercel.app`).
4. **Deploy**. Spara admin-URL:en.

---

## Steg 5: Testa

- **Web:** Öppna web-URL → produkter ska visas (bastu, startsida, etc.).
- **Admin:** Öppna admin-URL → **Inventarie** ska visa samma produkter och sparade ändringar ska synas i web-appen.

---

## Miljövariabler (referens)

| App   | Variabel                   | Beskrivning |
|-------|----------------------------|-------------|
| web   | `SUPABASE_URL`             | Supabase Project URL |
| web   | `SUPABASE_SERVICE_ROLE_KEY`| Supabase service_role key (håll hemlig) |
| admin | `NEXT_PUBLIC_WEB_APP_URL`   | Webbappens URL (t.ex. Vercel-URL) |

Lokal utveckling: kopiera `apps/web/.env.example` till `apps/web/.env` och `apps/admin/.env.example` till `apps/admin/.env` om du vill använda Supabase lokalt. Utan dessa använder web-appen `data/products.json` och API:et fungerar lokalt (men skrivningar till fil fungerar inte på Vercel, därav Supabase).

---

## Felsökning

- **Build fel / "Cannot find module":** Kontrollera att **Root Directory** är `apps/web` respektive `apps/admin` och att du inte överstyrt install/build-kommandon (låt `vercel.json` gälla).
- **API returnerar 500:** Kontrollera att `SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` är satta för web-projektet och att du kört `schema.sql` + `seed.sql` i Supabase.
- **Admin visar inga produkter:** Kontrollera att `NEXT_PUBLIC_WEB_APP_URL` pekar på web-appens URL (med `https://`) och testa i webbläsaren: `https://din-web-url.vercel.app/api/products`.

---

## Kostnader

- **Vercel:** Gratis tier räcker (projekt, bandbredd, Serverless Functions).
- **Supabase:** Gratis tier räcker (databas, bandbredd, användare).

Ingen domän behövs; du använder Vercels subdomäner (t.ex. `*.vercel.app`).
