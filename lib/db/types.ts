// Tipi di dominio condivisi dal service layer.

export type Nutri = { kcal: number; p: number; c: number; f: number };

export type DiaryEntry = {
  id: string;
  ts: number;
  meal: string;
  food: string;
  note?: string;
  photo_url?: string;
  nutri?: Nutri;
  gonfiore?: number;
  dolore?: number;
  flatulenza?: number;
  regolarita?: number;
};

export type NewDiaryEntry = Omit<DiaryEntry, "id" | "ts"> & { ts?: number };

export type Measurement = {
  id: string;
  ts: number;
  weight?: number;
  waist?: number;
  hips?: number;
  abdomen?: number;
  fm?: number;
};

export type NewMeasurement = Omit<Measurement, "id" | "ts"> & { ts?: number };

export type Analysis = {
  id: string;
  ts: number;
  name: string;
  result?: string;
  file_url?: string;
};

export type NewAnalysis = Omit<Analysis, "id" | "ts"> & { ts?: number };

// Contratto UI <-> dati. Oggi implementato in memoria (makeLocalDb),
// domani da Supabase (makeSupabaseDb) senza toccare la UI.
export interface DB {
  diary: {
    list(): Promise<DiaryEntry[]>;
    add(e: NewDiaryEntry): Promise<DiaryEntry>;
    remove(id: string): Promise<void>;
  };
  measurements: {
    list(): Promise<Measurement[]>;
    add(m: NewMeasurement): Promise<Measurement>;
  };
  analyses: {
    list(): Promise<Analysis[]>;
    add(a: NewAnalysis): Promise<Analysis>;
  };
}
