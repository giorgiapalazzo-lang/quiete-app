-- Extend profiles with assessment data from the Quiete onboarding flow.

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
