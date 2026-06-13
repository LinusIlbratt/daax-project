# Forshälla Alltjänst — bokningssystem

Monorepo för maskinuthyrning (Forshälla Alltjänst AB), byggt med Turborepo, Next.js (App Router) och TypeScript.

## Struktur

- **apps/web** – Kundapp (Next.js), bokning och maskinkatalog
- **apps/admin** – Admin/CMS (Next.js), bokningar, kalender, inventarie
- **packages/ui** – Delat UI-bibliotek (förberedd struktur)
- **packages/config** – Delade konfigurationer (Tailwind, TypeScript, ESLint)
- **packages/emails** – Transaktionsmejl (Resend + React Email)
- **packages/types** – Delade domäntyper

## Förutsättningar

- Node.js 20+
- [pnpm](https://pnpm.io/) 9.x (rekommenderas) eller kompatibel version

Installera pnpm om det saknas:

```bash
npm install -g pnpm
```

## Installation

Från projektets rot:

```bash
pnpm install
```

## Köra båda apparna samtidigt

Starta web och admin i utvecklingsläge med Turborepo:

```bash
pnpm dev
```

- **Kundapp (web):** [http://localhost:3000](http://localhost:3000)
- **Admin (admin):** [http://localhost:3001](http://localhost:3001)

Turborepo kör båda apparna parallellt; ändringar i koden triggar ombyggnad där det behövs.

## Övriga kommandon

| Kommando     | Beskrivning                         |
| ------------ | ----------------------------------- |
| `pnpm dev`   | Startar web + admin (dev)           |
| `pnpm build` | Bygger alla appar och paket         |
| `pnpm lint`  | Kör lint i hela monorepon           |
| `pnpm clean` | Rensar build-cache och node_modules |

## Köra en enskild app

```bash
# Endast kundapp (port 3000)
pnpm --filter web dev

# Endast admin (port 3001)
pnpm --filter admin dev
```

## Tekniker

- **Språk:** TypeScript
- **Styling:** Tailwind CSS
- **Package manager:** pnpm (workspaces)
- **Monorepo:** Turborepo
- **Databas:** Supabase (PostgreSQL)
- **Betalning:** Stripe (Auth & Capture)
- **Mejl:** Resend
