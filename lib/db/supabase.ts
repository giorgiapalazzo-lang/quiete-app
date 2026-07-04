import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DB,
  DiaryEntry,
  Measurement,
  Analysis,
  NewDiaryEntry,
  NewMeasurement,
  NewAnalysis,
} from "./types";

const toTs = (v: string | null): number => (v ? new Date(v).getTime() : 0);

/**
 * Implementazione Supabase del service layer. Richiede un utente autenticato
 * (le policy RLS filtrano per auth.uid()). L'id utente viene risolto lato DB.
 */
export function makeSupabaseDb(sb: SupabaseClient): DB {
  return {
    diary: {
      async list() {
        const { data, error } = await sb
          .from("diary_entries")
          .select("id, ts, meal, food, note, photo_url, kcal, protein, carbs, fat")
          .order("ts", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(
          (r): DiaryEntry => ({
            id: r.id,
            ts: toTs(r.ts),
            meal: r.meal,
            food: r.food,
            note: r.note ?? undefined,
            photo_url: r.photo_url ?? undefined,
            nutri: {
              kcal: Number(r.kcal ?? 0),
              p: Number(r.protein ?? 0),
              c: Number(r.carbs ?? 0),
              f: Number(r.fat ?? 0),
            },
          }),
        );
      },
      async add(e: NewDiaryEntry) {
        const { data: userData } = await sb.auth.getUser();
        const uid = userData.user?.id;
        const { data, error } = await sb
          .from("diary_entries")
          .insert({
            user_id: uid,
            meal: e.meal,
            food: e.food,
            note: e.note,
            photo_url: e.photo_url,
            kcal: e.nutri?.kcal,
            protein: e.nutri?.p,
            carbs: e.nutri?.c,
            fat: e.nutri?.f,
          })
          .select()
          .single();
        if (error) throw error;
        if (
          e.gonfiore != null ||
          e.dolore != null ||
          e.flatulenza != null ||
          e.regolarita != null
        ) {
          await sb.from("symptoms").insert({
            entry_id: data.id,
            gonfiore: e.gonfiore,
            dolore: e.dolore,
            flatulenza: e.flatulenza,
            regolarita: e.regolarita,
          });
        }
        return { ...e, id: data.id, ts: toTs(data.ts) } as DiaryEntry;
      },
      async remove(id: string) {
        const { error } = await sb.from("diary_entries").delete().eq("id", id);
        if (error) throw error;
      },
    },

    measurements: {
      async list() {
        const { data, error } = await sb
          .from("measurements")
          .select("id, ts, weight, waist, hips, abdomen, fm")
          .order("ts", { ascending: true });
        if (error) throw error;
        return (data ?? []).map(
          (r): Measurement => ({
            id: r.id,
            ts: toTs(r.ts),
            weight: r.weight ?? undefined,
            waist: r.waist ?? undefined,
            hips: r.hips ?? undefined,
            abdomen: r.abdomen ?? undefined,
            fm: r.fm ?? undefined,
          }),
        );
      },
      async add(m: NewMeasurement) {
        const { data: userData } = await sb.auth.getUser();
        const { data, error } = await sb
          .from("measurements")
          .insert({ user_id: userData.user?.id, ...m })
          .select()
          .single();
        if (error) throw error;
        return { ...m, id: data.id, ts: toTs(data.ts) } as Measurement;
      },
    },

    analyses: {
      async list() {
        const { data, error } = await sb
          .from("analyses")
          .select("id, ts, name, result, file_url")
          .order("ts", { ascending: false });
        if (error) throw error;
        return (data ?? []).map(
          (r): Analysis => ({
            id: r.id,
            ts: toTs(r.ts),
            name: r.name,
            result: r.result ?? undefined,
            file_url: r.file_url ?? undefined,
          }),
        );
      },
      async add(a: NewAnalysis) {
        const { data: userData } = await sb.auth.getUser();
        const { data, error } = await sb
          .from("analyses")
          .insert({ user_id: userData.user?.id, ...a })
          .select()
          .single();
        if (error) throw error;
        return { ...a, id: data.id, ts: toTs(data.ts) } as Analysis;
      },
    },
  };
}
