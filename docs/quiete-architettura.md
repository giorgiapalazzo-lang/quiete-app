# Quiete — Architettura per la webapp (Supabase · Next.js · Vercel)

Questo documento è il ponte tra il prototipo React (`quiete.jsx`) e l'app reale.
Il prototipo chiama già un **service layer astratto** (`db.*`, tutte funzioni `async`):
in produzione sostituisci `makeLocalDb()` con `makeSupabaseDb()` **senza toccare la UI**.

---

## 1. Stack

| Livello        | Scelta                          | Note |
|----------------|----------------------------------|------|
| Frontend       | **Next.js 15** (App Router) + React | il prototipo diventa `components/` + `app/` |
| Stili          | inline tokens (già in `quiete.jsx`) o Tailwind con gli stessi hex | Playfair Display + Inter |
| Auth           | **Supabase Auth** (email + Google/Apple OAuth) | sostituisce l'auth locale del prototipo HTML |
| Database       | **Supabase Postgres** + Row Level Security | un utente vede solo i propri dati |
| Storage        | **Supabase Storage** (bucket `photos`, `referti`, `piani-pdf`) | foto pasto, referti, PDF nutrizionista |
| Funzioni server| **Supabase Edge Functions** (Deno) | import PDF, sync calendario |
| Deploy         | **GitHub → Vercel** | env in Vercel, preview per ogni PR |

---

## 2. Modello dati (le tue diete → tabelle)

Le 7 diete rivelano il modello: **piano → slot pasto → opzioni → componenti → equivalenze**,
più antropometria, frequenze, integrazione, diario. Schema SQL iniziale:

```sql
-- Profilo (1:1 con auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, sex text, birthdate date, height_cm numeric,
  created_at timestamptz default now()
);

-- Le tue nutrizioniste (ne hai 4+)
create table nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null, title text, email text, phone text
);

-- Un piano alimentare
create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  nutritionist_id uuid references nutritionists,
  name text, kcal int, goal text, condition text,
  source_pdf_url text,           -- il PDF originale in Storage
  start_date date, is_active boolean default false,
  created_at timestamptz default now()
);

-- Note del piano: generali, stipsi, reflusso, integrazione, frequenze…
create table plan_notes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  kind text,     -- 'generale' | 'stipsi' | 'reflusso' | 'integrazione'
  content text
);

-- Dizionario alimenti + classificazione FODMAP
create table foods (
  id uuid primary key default gen_random_uuid(),
  name text, category text,
  fodmap text,          -- 'ok' | 'mod' | 'no'
  default_unit text default 'g',
  -- valori nutrizionali per 100 g (per kcal + macro di ogni pasto e del giorno)
  kcal numeric, protein numeric, carbs numeric, fat numeric, fiber numeric
);

-- Gruppi di equivalenza (Pasta 60g = Riso 60g = Patate 250g…)
create table exchange_groups (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  role text,            -- 'carbo' | 'proteine' | 'grassi' | 'verdura'
  label text
);
create table exchange_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references exchange_groups on delete cascade,
  food_id uuid references foods,
  amount_g numeric, is_base boolean default false
);

-- Slot dei pasti + assegnazione giorno per giorno
create table meal_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  key text,             -- 'colazione'|'spuntino_am'|'pranzo'|'merenda'|'cena'|'durante'
  label text, sort int
);
create table weekly_plan (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  day_of_week int,      -- 0=Lun … 6=Dom
  slot_id uuid references meal_slots,
  food_id uuid references foods,
  amount_g numeric,
  exchange_group_id uuid references exchange_groups  -- abilita le sostituzioni
);

-- Regole di frequenza (pesce 3-4/sett, latticini 2/sett…)
create table frequency_rules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  food_group text, max_per_week int, min_per_week int
);

-- Integrazione
create table supplements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  name text, dose text, timing text, time_of_day time
);

-- Piano di allenamento (integrato con la dieta: is_training_day -> più carbo a pranzo)
create table workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  day_of_week int,          -- 0=Lun … 6=Dom
  title text, duration_min int, is_training_day boolean,
  exercises jsonb           -- [{name, sets, reps}]
);

-- Diario pasti + sintomi
create table diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(),
  meal text, food text, note text, photo_url text
);
create table symptoms (
  entry_id uuid primary key references diary_entries on delete cascade,
  gonfiore int, dolore int, flatulenza int, regolarita int,
  reflusso boolean, bristol int
);

-- Antropometria / composizione corporea (dai tuoi referti BIA)
create table measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(),
  weight numeric, bmi numeric, waist numeric, hips numeric,
  abdomen numeric, thigh numeric, arm numeric,
  ffm numeric, fm numeric, tbw numeric
);

-- Referti / analisi
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(), name text, result text, file_url text
);

-- Preferenze calendario
create table calendar_links (
  user_id uuid primary key references auth.users on delete cascade,
  provider text, refresh_token text  -- cifrato / lato Edge Function
);
```

### Row Level Security (una policy per tabella)

```sql
alter table diary_entries enable row level security;
create policy "own rows" on diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- ripeti per profiles, plans, measurements, analyses…
-- foods è condiviso (read-only pubblico): policy select true.
```

---

## 3. Service layer (contratto UI ↔ dati)

La UI conosce **solo** queste funzioni. Oggi tornano da stato locale, domani da Supabase.

```ts
// lib/db/index.ts
export interface DB {
  plans: {
    listMine(): Promise<Plan[]>;
    setActive(id: string): Promise<void>;
    getWeekly(planId: string): Promise<WeeklyMeal[]>;
    importFromPdf(fileUrl: string): Promise<Plan>;   // → Edge Function
  };
  foods: { equivalences(groupId: string): Promise<ExchangeItem[]>; };
  diary: {
    list(range?: DateRange): Promise<DiaryEntry[]>;
    add(e: NewDiaryEntry): Promise<DiaryEntry>;
    remove(id: string): Promise<void>;
    weekFrequency(): Promise<Record<string, number>>;
  };
  measurements: { list(): Promise<Measurement[]>; add(m: NewMeasurement): Promise<void>; };
  analyses: { list(): Promise<Analysis[]>; add(a: NewAnalysis): Promise<void>; };
}
```

```ts
// lib/db/supabase.ts  (esempio: diary.add)
export function makeSupabaseDb(sb: SupabaseClient): DB {
  return {
    diary: {
      async add(e) {
        const { data } = await sb.from("diary_entries")
          .insert({ meal: e.meal, food: e.food, note: e.note, photo_url: e.photo })
          .select().single();
        if (e.symptoms) await sb.from("symptoms").insert({ entry_id: data.id, ...e.symptoms });
        return data;
      },
      // …list, remove, weekFrequency (query SQL sul range settimanale)
    },
    // …plans, foods, measurements
  };
}
```

Nel prototipo la stessa interfaccia è già implementata in memoria (`makeLocalDb`):
i componenti fanno `await db.diary.add(...)`, `await db.measurements.add(...)` ecc.

---

## 4. Struttura cartelle (Next.js)

```
quiete/
├─ app/
│  ├─ (auth)/login/page.tsx        # Supabase Auth UI
│  ├─ (app)/oggi/page.tsx
│  ├─ (app)/piano/page.tsx
│  ├─ (app)/alimenti/page.tsx
│  ├─ (app)/diario/page.tsx
│  ├─ (app)/profilo/page.tsx
│  └─ layout.tsx                   # shell: header + bottom nav
├─ components/                     # Card, Pill, Ring, Sheet, SwapSheet… (da quiete.jsx)
├─ lib/
│  ├─ supabase/{client,server}.ts
│  ├─ db/{index,supabase}.ts       # il service layer
│  └─ types.ts
├─ styles/tokens.ts                # gli hex del brand
├─ supabase/
│  ├─ migrations/0001_init.sql     # lo schema qui sopra
│  └─ functions/
│     ├─ import-plan-pdf/          # PDF → struttura (LLM)
│     └─ calendar-sync/            # Google/Microsoft
└─ package.json
```

---

## 5. Edge Functions (le due che valgono di più)

- **`import-plan-pdf`** — carichi il PDF della nutrizionista in Storage, la funzione lo legge
  (estrazione testo + LLM con schema forzato) e popola `plans` + `meal_slots` + `weekly_plan`
  + `exchange_groups`. È la feature "Importa un piano da PDF" del prototipo. Hai già 7 PDF di test.
- **`calendar-sync`** — OAuth Google Calendar API / Microsoft Graph lato server; scrive i pasti
  del piano come eventi ricorrenti. Il prototipo intanto fa export `.ics` + deep-link (senza backend).
- **`analyze-meal-photo`** — riceve la foto del pasto, chiama un modello vision (Claude) con schema JSON
  forzato e restituisce `{alimenti:[{nome, grammi, kcal, proteine, carboidrati, grassi}], totale}`.
  L'utente corregge le grammature e salva in `diary_entries` + valori nutrizionali. Nel prototipo la
  chiamata gira direttamente lato client; in produzione passa da qui per non esporre chiavi e per il rate-limit.

---

## 6. Auth & deploy

1. Progetto Supabase → copia `URL` e `anon key`.
2. `supabase db push` con `0001_init.sql` (schema + RLS).
3. Repo su **GitHub** → importa in **Vercel**.
4. Env su Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   e `SUPABASE_SERVICE_ROLE_KEY` (solo server, per le Edge Functions).
5. Ogni push → deploy automatico; ogni PR → preview URL.

---

## 7. Roadmap features (priorità)

| # | Feature | Dove |
|---|---------|------|
| 1 | Valori nutrizionali + macro + kcal del giorno | ✅ nel prototipo · `foods.kcal/protein/carbs/fat` |
| 2 | Foto-AI con stima grammature | ✅ nel prototipo · Edge Function `analyze-meal-photo` |
| 3 | Motore di sostituzioni (equivalenze) | ✅ nel prototipo · tabelle `exchange_*` |
| 4 | Lista della spesa dal piano | ✅ nel prototipo · aggregazione `weekly_plan` |
| 5 | Piano di allenamento (integrato con la dieta) | ✅ nel prototipo · tabella `workouts` |
| 6 | Antropometria + grafici | ✅ nel prototipo · `measurements` |
| 7 | Frequenze settimanali dal diario | ✅ nel prototipo · query su `diary_entries` |
| 8 | Libreria multi-piano (nutrizioniste) | ✅ nel prototipo · `plans` + `nutritionists` |
| 9 | Correlazione sintomi ↔ cibo + report visita | ✅ nel prototipo · query su `diary_entries` + `symptoms` |
| 10| Import piano da PDF | Edge Function `import-plan-pdf` |
| 11| Sync calendario automatico | Edge Function `calendar-sync` |
| 12| Fase di reintroduzione FODMAP | stato nel `plans` + calendario dedicato |
| 13| Accorgimenti per condizione (stipsi/reflusso) | `plan_notes.kind` |
```
