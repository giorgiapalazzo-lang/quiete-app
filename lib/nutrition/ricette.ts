// ============================================================================
// Ricette di Quiete — ricette reali con ingredienti riferiti al database
// alimenti (ALIMENTI). I macro sono CALCOLATI dagli ingredienti (non inseriti a
// mano) e si riscalano per N persone. I flag dieta (FODMAP/glutine/lattosio)
// sono derivati dagli ingredienti, così l'app può filtrarle sul profilo.
// (In futuro questa lista può essere ampliata via generazione AI.)
// ============================================================================
import { ALIMENTI_BY_ID, nutriPerGrammi } from "./alimenti";

export type Pasto = "colazione" | "pranzo" | "cena" | "spuntino";
export type IllRicetta = "porridge" | "bowl" | "fish" | "eggs";

export type Ricetta = {
  id: string;
  nome: string;
  pasto: Pasto;
  tempo: number; // minuti
  porzioniBase: number;
  ill: IllRicetta;
  ingredienti: { id: string; g: number }[]; // per porzioniBase persone
  passi: string[];
};

export const RICETTE: Ricetta[] = [
  { id: "porridge_banana", nome: "Porridge d'avena, banana e mandorle", pasto: "colazione", tempo: 8, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "avena", g: 50 }, { id: "latte_scremato", g: 200 }, { id: "banana", g: 100 }, { id: "mandorle", g: 15 }],
    passi: ["Scalda l'avena col latte a fuoco basso 4–5 min mescolando.", "Versa in una ciotola, aggiungi la banana a fette.", "Completa con le mandorle tritate."] },
  { id: "yogurt_kiwi", nome: "Yogurt greco, kiwi e noci", pasto: "colazione", tempo: 5, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "yogurt_greco", g: 150 }, { id: "kiwi", g: 100 }, { id: "noci", g: 15 }],
    passi: ["Metti lo yogurt in una ciotola.", "Aggiungi il kiwi a pezzetti e le noci spezzettate."] },
  { id: "uova_spinaci", nome: "Uova strapazzate con spinaci", pasto: "colazione", tempo: 10, porzioniBase: 1, ill: "eggs",
    ingredienti: [{ id: "uovo", g: 120 }, { id: "spinaci", g: 100 }, { id: "olio_evo", g: 5 }],
    passi: ["Salta gli spinaci in padella con l'olio 2 min.", "Aggiungi le uova sbattute e mescola a fuoco basso finché rapprendono."] },
  { id: "riso_pollo_zucchine", nome: "Riso basmati, pollo e zucchine", pasto: "pranzo", tempo: 25, porzioniBase: 1, ill: "bowl",
    ingredienti: [{ id: "riso_basmati", g: 80 }, { id: "pollo_petto", g: 130 }, { id: "zucchine", g: 150 }, { id: "olio_evo", g: 10 }],
    passi: ["Lessa il riso.", "Salta il pollo a cubetti e le zucchine a rondelle con metà olio.", "Unisci il riso, condisci con l'olio rimasto."] },
  { id: "quinoa_salmone", nome: "Quinoa, salmone e cetrioli", pasto: "pranzo", tempo: 20, porzioniBase: 1, ill: "bowl",
    ingredienti: [{ id: "quinoa", g: 70 }, { id: "salmone", g: 120 }, { id: "cetrioli", g: 100 }, { id: "olio_evo", g: 8 }],
    passi: ["Cuoci la quinoa 12 min e scolala.", "Scotta il salmone in padella.", "Aggiungi i cetrioli a dadini e condisci con l'olio."] },
  { id: "pasta_tonno", nome: "Pasta integrale, pomodoro e tonno", pasto: "pranzo", tempo: 20, porzioniBase: 1, ill: "bowl",
    ingredienti: [{ id: "pasta_integrale", g: 80 }, { id: "pomodori", g: 150 }, { id: "tonno_naturale", g: 80 }, { id: "olio_evo", g: 10 }],
    passi: ["Cuoci la pasta.", "Prepara un sugo veloce coi pomodori e l'olio.", "Manteca con il tonno sgocciolato."] },
  { id: "ceci_feta", nome: "Insalata di ceci, pomodori e feta", pasto: "pranzo", tempo: 10, porzioniBase: 1, ill: "bowl",
    ingredienti: [{ id: "ceci", g: 150 }, { id: "pomodori", g: 150 }, { id: "feta", g: 40 }, { id: "olio_evo", g: 10 }],
    passi: ["Unisci ceci, pomodori a spicchi e feta a cubetti.", "Condisci con l'olio e, se gradita, menta fresca."] },
  { id: "merluzzo_patate", nome: "Merluzzo al forno, patate e carote", pasto: "cena", tempo: 30, porzioniBase: 1, ill: "fish",
    ingredienti: [{ id: "merluzzo", g: 180 }, { id: "patate", g: 200 }, { id: "carote", g: 150 }, { id: "olio_evo", g: 10 }],
    passi: ["Taglia patate e carote a tocchetti, condisci con metà olio.", "Inforna a 200° 15 min, poi aggiungi il merluzzo e l'olio rimasto.", "Cuoci altri 12–15 min."] },
  { id: "frittata_zucchine", nome: "Frittata di zucchine", pasto: "cena", tempo: 15, porzioniBase: 1, ill: "eggs",
    ingredienti: [{ id: "uovo", g: 120 }, { id: "zucchine", g: 150 }, { id: "parmigiano", g: 15 }, { id: "olio_evo", g: 8 }],
    passi: ["Salta le zucchine a rondelle con l'olio.", "Versa le uova sbattute col parmigiano.", "Cuoci 3 min per lato."] },
  { id: "orata_finocchi", nome: "Orata al cartoccio con finocchi", pasto: "cena", tempo: 30, porzioniBase: 1, ill: "fish",
    ingredienti: [{ id: "orata", g: 170 }, { id: "finocchi", g: 200 }, { id: "olio_evo", g: 10 }],
    passi: ["Affetta i finocchi, disponili su carta forno con l'orata.", "Condisci con olio, chiudi il cartoccio.", "Inforna a 190° per 20–25 min."] },
  { id: "tacchino_insalata", nome: "Tacchino ai ferri e insalata mista", pasto: "cena", tempo: 15, porzioniBase: 1, ill: "bowl",
    ingredienti: [{ id: "tacchino", g: 150 }, { id: "insalata", g: 80 }, { id: "pomodori", g: 100 }, { id: "olio_evo", g: 10 }],
    passi: ["Cuoci la fesa di tacchino ai ferri 3–4 min per lato.", "Prepara l'insalata con pomodori e olio.", "Servi il tacchino a fette sull'insalata."] },
  { id: "yogurt_mirtilli", nome: "Yogurt greco e mirtilli", pasto: "spuntino", tempo: 3, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "yogurt_greco", g: 150 }, { id: "mirtilli", g: 100 }],
    passi: ["Unisci lo yogurt e i mirtilli."] },
  { id: "mela_mandorle", nome: "Mela e mandorle", pasto: "spuntino", tempo: 2, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "mela", g: 150 }, { id: "mandorle", g: 20 }],
    passi: ["Sbuccia la mela a spicchi e accompagna con le mandorle."] },
  // --- Low-FODMAP (per IBS) ---
  { id: "porridge_quinoa", nome: "Porridge di quinoa, banana e noci", pasto: "colazione", tempo: 12, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "quinoa", g: 50 }, { id: "banana", g: 100 }, { id: "noci", g: 15 }],
    passi: ["Cuoci la quinoa in acqua 12 min finché morbida.", "Schiaccia metà banana e mescolala alla quinoa calda.", "Completa con la banana a fette e le noci."] },
  { id: "banana_noci", nome: "Banana e noci", pasto: "spuntino", tempo: 2, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "banana", g: 120 }, { id: "noci", g: 15 }],
    passi: ["Affetta la banana e accompagnala con le noci."] },
  { id: "kiwi_noci", nome: "Kiwi e noci", pasto: "spuntino", tempo: 2, porzioniBase: 1, ill: "porridge",
    ingredienti: [{ id: "kiwi", g: 150 }, { id: "noci", g: 15 }],
    passi: ["Taglia i kiwi e accompagnali con le noci."] },
];

/** Ingredienti riscalati per N porzioni, con nome leggibile. */
export function ingredientiScalati(r: Ricetta, porzioni: number) {
  const scale = porzioni / r.porzioniBase;
  return r.ingredienti.map((i) => {
    const a = ALIMENTI_BY_ID[i.id];
    return { id: i.id, nome: a ? a.nome : i.id, g: Math.round(i.g * scale) };
  });
}

/** Macro totali della ricetta per N porzioni (somma degli ingredienti scalati). */
export function macroRicetta(r: Ricetta, porzioni: number) {
  const scale = porzioni / r.porzioniBase;
  return r.ingredienti.reduce(
    (acc, i) => {
      const n = nutriPerGrammi(i.id, i.g * scale);
      if (!n) return acc;
      return { kcal: acc.kcal + n.kcal, proteine: acc.proteine + n.proteine, carboidrati: acc.carboidrati + n.carboidrati, grassi: acc.grassi + n.grassi };
    },
    { kcal: 0, proteine: 0, carboidrati: 0, grassi: 0 },
  );
}

/** Flag dieta derivati dagli ingredienti. */
export function ricettaFlags(r: Ricetta) {
  const al = r.ingredienti.map((i) => ALIMENTI_BY_ID[i.id]).filter(Boolean);
  return {
    fodmapBasso: al.every((a) => a.fodmap === "basso"),
    senzaGlutine: al.every((a) => !a.glutine),
    senzaLattosio: al.every((a) => !a.lattosio),
  };
}

/** Ricette compatibili col profilo + filtro per pasto e per alimento contenuto. */
export function filtraRicette(opts: { pasto?: Pasto | "tutti"; ingrediente?: string; fodmapBasso?: boolean; senzaGlutine?: boolean; senzaLattosio?: boolean }) {
  const q = (opts.ingrediente || "").trim().toLowerCase();
  return RICETTE.filter((r) => {
    if (opts.pasto && opts.pasto !== "tutti" && r.pasto !== opts.pasto) return false;
    const f = ricettaFlags(r);
    if (opts.fodmapBasso && !f.fodmapBasso) return false;
    if (opts.senzaGlutine && !f.senzaGlutine) return false;
    if (opts.senzaLattosio && !f.senzaLattosio) return false;
    if (q) {
      const hit = r.ingredienti.some((i) => (ALIMENTI_BY_ID[i.id]?.nome || "").toLowerCase().includes(q)) || r.nome.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  });
}
