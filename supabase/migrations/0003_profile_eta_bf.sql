-- Persistenza di età e massa grassa: servono al ricalcolo del fabbisogno
-- (Mifflin usa l'età; Katch-McArdle usa la % massa grassa). Senza queste, un
-- profilo caricato da Supabase non poteva ricalcolare i macro (usciva NaN).

alter table profiles
  add column if not exists eta int,
  add column if not exists massa_grassa numeric;
