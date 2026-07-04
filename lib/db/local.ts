import type {
  DB,
  DiaryEntry,
  Measurement,
  Analysis,
  NewDiaryEntry,
  NewMeasurement,
  NewAnalysis,
} from "./types";

/**
 * Implementazione in memoria del service layer, per lo sviluppo e come
 * fallback finché Supabase non è collegato. Stessa interfaccia di makeSupabaseDb.
 */
export function makeLocalDb(seed?: {
  diary?: DiaryEntry[];
  measurements?: Measurement[];
  analyses?: Analysis[];
}): DB {
  let diary: DiaryEntry[] = seed?.diary ?? [];
  let measurements: Measurement[] = seed?.measurements ?? [];
  let analyses: Analysis[] = seed?.analyses ?? [];
  const id = (p: string) => p + Math.floor(performance.now() * 1000);

  return {
    diary: {
      async list() {
        return [...diary].sort((a, b) => b.ts - a.ts);
      },
      async add(e: NewDiaryEntry) {
        const row: DiaryEntry = { ...e, id: id("d"), ts: e.ts ?? Date.now() };
        diary = [row, ...diary];
        return row;
      },
      async remove(rid: string) {
        diary = diary.filter((x) => x.id !== rid);
      },
    },
    measurements: {
      async list() {
        return [...measurements].sort((a, b) => a.ts - b.ts);
      },
      async add(m: NewMeasurement) {
        const row: Measurement = { ...m, id: id("m"), ts: m.ts ?? Date.now() };
        measurements = [...measurements, row].sort((a, b) => a.ts - b.ts);
        return row;
      },
    },
    analyses: {
      async list() {
        return [...analyses].sort((a, b) => b.ts - a.ts);
      },
      async add(a: NewAnalysis) {
        const row: Analysis = { ...a, id: id("a"), ts: a.ts ?? Date.now() };
        analyses = [row, ...analyses];
        return row;
      },
    },
  };
}
