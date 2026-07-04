# Quiete

App di nutrizione personale: piano alimentare, diario pasti + sintomi, composizione corporea, foto-AI dei pasti. Next.js 16 (App Router) · Supabase · Vercel.

Portata dal prototipo `quiete.jsx` seguendo `quiete-architettura.md`.

## Stack

- **Frontend**: Next.js 16 + React 19 — la UI del prototipo vive in `app/QuieteApp.jsx`
- **Foto-AI**: serverless route `app/api/analyze-meal` → Claude (`claude-opus-4-8`), la chiave resta lato server
- **Dati**: Supabase Postgres + Row Level Security (`supabase/migrations/0001_init.sql`)
- **Service layer**: `lib/db` — stessa interfaccia in memoria (`local`) e su Supabase (`supabase`)
- **Deploy**: GitHub → Vercel

## Sviluppo

```bash
npm install
cp .env.example .env.local   # compila i valori
npm run dev                  # http://localhost:3000
```

Senza env Supabase l'app parte comunque: il service layer fa fallback sul DB in memoria.

## Variabili d'ambiente

| Nome | Dove | Scopo |
|------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | solo server | operazioni admin / Edge Functions |
| `ANTHROPIC_API_KEY` | solo server | foto-AI (`/api/analyze-meal`) |

Su Vercel: Project Settings → Environment Variables.

## Database

Applica lo schema al progetto Supabase:

```bash
supabase db push          # con la Supabase CLI
# oppure incolla supabase/migrations/0001_init.sql nel SQL editor di Supabase
```

## Stato / prossimi passi

- [x] UI del prototipo online (dati locali in memoria)
- [x] Schema Postgres + RLS pronti
- [x] Service layer Supabase pronto (`lib/db/supabase.ts`)
- [x] Foto-AI via serverless route
- [ ] Supabase Auth (login email + OAuth) e collegamento della UI al service layer
- [ ] Storage (foto pasto, referti, PDF piani) + Edge Functions (import PDF, calendario)
