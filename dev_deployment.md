# Deployment — Forshälla Alltjänst (staging för kundtest)

Guide för att deploya **web** (kund) och **admin** (CMS) så kunden kan testa online.

**Rekommendation:** **Vercel** (inte Netlify) — projektet har redan `vercel.json` i båda apparna, Next.js App Router, API-routes, Stripe-webhook och cron för utgångna bokningar. Netlify fungerar men kräver extra monorepo-konfiguration utan vinst.

**Kostnad:** Vercel + Supabase free tier räcker för kundtest. Ingen egen domän krävs (`*.vercel.app`).

---

## Förutsättningar

- [ ] Kod pushad till GitHub (Vercel deployar från repo)
- [ ] Supabase-projekt `hctwdgjzvvgdtfbwnmnn` — migrationer körda (`supabase db push`)
- [ ] Stripe **test**-nycklar (Auth & Capture)
- [ ] Resend API-nyckel (test: `onboarding@resend.dev` → bara till kontots e-post)
- [ ] Minst en **admin-användare** i Supabase Auth med roll `ADMIN`

---

## Steg 0: Pusha kod till GitHub

Lokal kod måste finnas på GitHub innan Vercel kan bygga.

```bash
git add .
git commit -m "…"
git push origin main
```

Repo: `https://github.com/LinusIlbratt/daax-project`

---

## Steg 1: Supabase — Auth för admin

1. **Authentication → URL Configuration**
   - **Site URL:** `https://DIN-ADMIN-URL.vercel.app`
   - **Redirect URLs:** lägg till  
     `https://DIN-ADMIN-URL.vercel.app/**`  
     (uppdatera efter första deploy om URL inte finns än)

2. **Authentication → Users** — skapa användare för kunden (e-post + lösenord)

3. **SQL Editor** — ge admin-roll (byt `USER_UUID`):

```sql
INSERT INTO public.user_roles (id, role)
VALUES ('USER_UUID', 'ADMIN')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
```

UUID hittas under Authentication → Users → klicka användare.

---

## Steg 2: Vercel — Web (kundapp)

1. [vercel.com](https://vercel.com) → **Add New Project** → välj repo
2. **Root Directory:** `apps/web`
3. Låt `apps/web/vercel.json` styra install/build (ändra inte om det fungerar)
4. **Environment Variables** (Production + Preview):

| Variabel | Värde |
|----------|--------|
| `SUPABASE_URL` | `https://hctwdgjzvvgdtfbwnmnn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service role från Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | samma som SUPABASE_URL |
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | från Stripe (steg 4) |
| `RESEND_API_KEY` | `re_…` |
| `RESEND_FROM_EMAIL` | `Forshälla Alltjänst <onboarding@resend.dev>` (test) |
| `CRON_SECRET` | slumpad sträng (min 16 tecken) |
| `PENDING_BOOKING_EXPIRY_HOURS` | `24` |

5. **Deploy** → spara URL, t.ex. `https://forshalla-web.vercel.app`

---

## Steg 3: Vercel — Admin (CMS)

1. **Add New Project** → **samma repo**, nytt Vercel-projekt
2. **Root Directory:** `apps/admin`
3. **Environment Variables:**

| Variabel | Värde |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hctwdgjzvvgdtfbwnmnn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key från Supabase |
| `NEXT_PUBLIC_WEB_APP_URL` | web-URL från steg 2 (`https://…`) |
| `STRIPE_SECRET_KEY` | samma `sk_test_…` som web |
| `RESEND_API_KEY` | samma som web |
| `RESEND_FROM_EMAIL` | samma som web |

4. **Deploy** → spara URL, t.ex. `https://forshalla-admin.vercel.app`

5. Gå tillbaka till **Supabase Auth URL Configuration** och uppdatera Site URL + Redirect URLs med admin-URL.

---

## Steg 4: Stripe webhook (prod-URL)

1. [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks) → **Add endpoint**
2. **URL:** `https://DIN-WEB-URL.vercel.app/api/webhooks/stripe`
3. **Events:** `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`
4. Kopiera **Signing secret** (`whsec_…`) → Vercel → web-projekt → `STRIPE_WEBHOOK_SECRET` → **Redeploy**

---

## Steg 5: Kundtest — checklista

| # | Test |
|---|------|
| 1 | Web: startsida visar utbud |
| 2 | Web: boka → Stripe testkort `4242…` |
| 3 | Admin: logga in → se bokning |
| 4 | Admin: godkänn → capture + mejl |
| 5 | Admin: inventarie → lägg till produkt → syns på web inom ~1 min |

**Stripe testkort:** `4242 4242 4242 4242`, valfritt datum/CVC.

---

## Miljövariabler — snabbreferens

### Web

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `STRIPE_*`, `RESEND_*`, `CRON_SECRET`

### Admin

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_WEB_APP_URL`, `STRIPE_SECRET_KEY`, `RESEND_*`

**Lokal utveckling:** `apps/web/.env.local`, `apps/admin/.env` — committa aldrig dessa.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| Build fail på Vercel | Root Directory `apps/web` / `apps/admin`; kolla build-logg |
| Admin redirect loop | Supabase Site URL + Redirect URLs = admin-URL |
| Admin "Unauthorized" | `user_roles` saknar `ADMIN` för användaren |
| Bokning 503 | Web saknar Supabase/Stripe env |
| Webhook 400 | Fel `STRIPE_WEBHOOK_SECRET` eller gammal deploy |
| Mejl skickas inte | Resend testläge — endast till kontots e-post |
| Cron 401 | `CRON_SECRET` saknas på web |

---

## Efter kundtest (prod)

- Verifiera domän i Resend → uppdatera `RESEND_FROM_EMAIL`
- Stripe **live**-nycklar + ny webhook mot samma endpoint
- Ev. egen domän i Vercel (`bokning.forshalla.se`, `admin.forshalla.se`)
