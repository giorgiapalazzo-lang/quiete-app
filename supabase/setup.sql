-- ============================================================
-- QUIETE — SETUP COMPLETO SUPABASE
-- Incolla tutto questo file nel SQL Editor di Supabase e premi "Run".
-- Unisce: 0001_init.sql (schema + RLS) + 0002_profiles_assessment.sql
-- Sicuro da rieseguire (create ... if not exists / add column if not exists).
-- ============================================================

-- Profilo (1:1 con auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, sex text, birthdate date, height_cm numeric,
  created_at timestamptz default now()
);

-- Le nutrizioniste
create table if not exists nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  name text not null, title text, email text, phone text
);

-- Un piano alimentare
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  nutritionist_id uuid references nutritionists,
  name text, kcal int, goal text, condition text,
  source_pdf_url text,
  start_date date, is_active boolean default false,
  created_at timestamptz default now()
);

-- Note del piano
create table if not exists plan_notes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  kind text,
  content text
);

-- Dizionario alimenti + classificazione FODMAP
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text, category text,
  fodmap text,
  default_unit text default 'g',
  kcal numeric, protein numeric, carbs numeric, fat numeric, fiber numeric
);

-- Gruppi di equivalenza
create table if not exists exchange_groups (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  role text,
  label text
);
create table if not exists exchange_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references exchange_groups on delete cascade,
  food_id uuid references foods,
  amount_g numeric, is_base boolean default false
);

-- Slot dei pasti + assegnazione giorno per giorno
create table if not exists meal_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  key text,
  label text, sort int
);
create table if not exists weekly_plan (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  day_of_week int,
  slot_id uuid references meal_slots,
  food_id uuid references foods,
  amount_g numeric,
  exchange_group_id uuid references exchange_groups
);

-- Regole di frequenza
create table if not exists frequency_rules (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  food_group text, max_per_week int, min_per_week int
);

-- Integrazione
create table if not exists supplements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  name text, dose text, timing text, time_of_day time
);

-- Piano di allenamento
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans on delete cascade,
  day_of_week int,
  title text, duration_min int, is_training_day boolean,
  exercises jsonb
);

-- Diario pasti + sintomi
create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(),
  meal text, food text, note text, photo_url text,
  kcal numeric, protein numeric, carbs numeric, fat numeric
);
create table if not exists symptoms (
  entry_id uuid primary key references diary_entries on delete cascade,
  gonfiore int, dolore int, flatulenza int, regolarita int,
  reflusso boolean, bristol int
);

-- Antropometria / composizione corporea
create table if not exists measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(),
  weight numeric, bmi numeric, waist numeric, hips numeric,
  abdomen numeric, thigh numeric, arm numeric,
  ffm numeric, fm numeric, tbw numeric
);

-- Referti / analisi
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  ts timestamptz default now(), name text, result text, file_url text
);

-- Preferenze calendario
create table if not exists calendar_links (
  user_id uuid primary key references auth.users on delete cascade,
  provider text, refresh_token text
);

-- Campi assessment dal flusso onboarding Quiete (ex 0002)
alter table profiles
  add column if not exists email text,
  add column if not exists peso numeric,
  add column if not exists attivita text,
  add column if not exists obiettivo text,
  add column if not exists allenamento text,
  add column if not exists condizioni text[] default '{}',
  add column if not exists kcal_obiettivo int,
  add column if not exists macro_proteine numeric,
  add column if not exists macro_carboidrati numeric,
  add column if not exists macro_grassi numeric,
  add column if not exists archetipo text,
  add column if not exists assessment_done boolean default false;

-- ============================================================
-- Row Level Security: ogni utente vede solo i propri dati.
-- foods è condiviso (lettura pubblica).
-- ============================================================
alter table profiles          enable row level security;
alter table nutritionists     enable row level security;
alter table plans             enable row level security;
alter table plan_notes        enable row level security;
alter table exchange_groups   enable row level security;
alter table exchange_items    enable row level security;
alter table meal_slots        enable row level security;
alter table weekly_plan       enable row level security;
alter table frequency_rules   enable row level security;
alter table supplements       enable row level security;
alter table workouts          enable row level security;
alter table diary_entries     enable row level security;
alter table symptoms          enable row level security;
alter table measurements      enable row level security;
alter table analyses          enable row level security;
alter table calendar_links    enable row level security;
alter table foods             enable row level security;

-- Policy: drop + create così è sicuro rieseguire tutto il file.
drop policy if exists "own profiles"      on profiles;
drop policy if exists "own nutritionists" on nutritionists;
drop policy if exists "own plans"         on plans;
drop policy if exists "own diary"         on diary_entries;
drop policy if exists "own measurements"  on measurements;
drop policy if exists "own analyses"      on analyses;
drop policy if exists "own calendar"      on calendar_links;
drop policy if exists "foods readable"    on foods;
drop policy if exists "plan children notes"    on plan_notes;
drop policy if exists "plan children groups"   on exchange_groups;
drop policy if exists "plan children slots"    on meal_slots;
drop policy if exists "plan children weekly"   on weekly_plan;
drop policy if exists "plan children freq"     on frequency_rules;
drop policy if exists "plan children supp"     on supplements;
drop policy if exists "plan children workouts" on workouts;
drop policy if exists "exchange items owner"   on exchange_items;
drop policy if exists "symptoms owner"         on symptoms;

-- Tabelle con user_id diretto
create policy "own profiles"      on profiles      for all using (auth.uid() = id)      with check (auth.uid() = id);
create policy "own nutritionists" on nutritionists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plans"         on plans         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own diary"         on diary_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own measurements"  on measurements  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own analyses"      on analyses      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own calendar"      on calendar_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- foods: lettura pubblica
create policy "foods readable" on foods for select using (true);

-- Tabelle figlie del piano: accessibili se il piano appartiene all'utente
create policy "plan children notes"    on plan_notes      for all using (exists (select 1 from plans p where p.id = plan_notes.plan_id     and p.user_id = auth.uid()));
create policy "plan children groups"   on exchange_groups for all using (exists (select 1 from plans p where p.id = exchange_groups.plan_id and p.user_id = auth.uid()));
create policy "plan children slots"    on meal_slots      for all using (exists (select 1 from plans p where p.id = meal_slots.plan_id     and p.user_id = auth.uid()));
create policy "plan children weekly"   on weekly_plan     for all using (exists (select 1 from plans p where p.id = weekly_plan.plan_id     and p.user_id = auth.uid()));
create policy "plan children freq"     on frequency_rules for all using (exists (select 1 from plans p where p.id = frequency_rules.plan_id and p.user_id = auth.uid()));
create policy "plan children supp"     on supplements     for all using (exists (select 1 from plans p where p.id = supplements.plan_id     and p.user_id = auth.uid()));
create policy "plan children workouts" on workouts        for all using (exists (select 1 from plans p where p.id = workouts.plan_id        and p.user_id = auth.uid()));
create policy "exchange items owner"   on exchange_items  for all using (exists (select 1 from exchange_groups g join plans p on p.id = g.plan_id where g.id = exchange_items.group_id and p.user_id = auth.uid()));
create policy "symptoms owner"         on symptoms        for all using (exists (select 1 from diary_entries d where d.id = symptoms.entry_id and d.user_id = auth.uid()));
