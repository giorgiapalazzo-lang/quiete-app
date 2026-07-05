import type { Macro } from "./engine";
import { RIPARTIZIONE_PASTI } from "./engine";
import type { Condizione, ArchetipoId } from "./archetipi";
import { ALIMENTI, filtraAlimenti, type Alimento } from "./alimenti";

export type ItemPiano = { n: string; g: number; id: string };
export type SlotPiano = { slot: string; items: ItemPiano[] };

export type GiornoPiano = {
  pranzo: ItemPiano[];
  cena: ItemPiano[];
  nota: string;
};

export type PianoGenerato = {
  colazione: SlotPiano;
  spuntino: SlotPiano;
  merenda: SlotPiano;
  olio: SlotPiano;
  giorni: GiornoPiano[];
};

function pick<T>(arr: T[], day: number, offset = 0): T {
  return arr[(day + offset) % arr.length];
}

function porzionePerMacro(
  alimento: Alimento,
  ruolo: "carb" | "prot" | "fat",
  targetG: number,
): number {
  const per100 =
    ruolo === "carb" ? alimento.carboidrati :
    ruolo === "prot" ? alimento.proteine :
    alimento.grassi;
  if (per100 <= 0) return alimento.porzioneG;
  const g = Math.round((targetG / per100) * 100);
  const min = Math.round(alimento.porzioneG * 0.5);
  const max = Math.round(alimento.porzioneG * 2.5);
  return Math.max(min, Math.min(max, g));
}

export function generaPiano(input: {
  kcalObiettivo: number;
  macro: Macro;
  condizioni: Condizione[];
  archetipo: ArchetipoId;
  variante?: number; // ruota gli alimenti per variare il piano ("Varia")
}): PianoGenerato {
  const V = input.variante ?? 0;
  const cond = new Set(input.condizioni);
  const foods = filtraAlimenti({
    senzaGlutine: cond.has("celiachia"),
    senzaLattosio: cond.has("intolleranza_lattosio"),
    soloFodmapBasso: cond.has("ibs"),
    vegetariano: cond.has("vegetariano"),
    vegano: cond.has("vegano"),
  });

  const byId = new Map(foods.map((f) => [f.id, f]));
  const byCat = (cat: string) => foods.filter((f) => f.categoria === cat);

  const cereali = byCat("cereali");
  const protAnimal = [...byCat("carne"), ...byCat("pesce")];
  const protAll = cond.has("vegano")
    ? [...byCat("legumi")]
    : cond.has("vegetariano")
      ? [...byCat("uova"), ...byCat("latticini"), ...byCat("legumi")]
      : [...protAnimal, ...byCat("uova")];
  const verdure = byCat("verdura").filter((v) => v.id !== "patate");
  const frutta = byCat("frutta").filter((f) => f.id !== "avocado");
  const fruttaSecca = byCat("frutta_secca");
  const latticini = byCat("latticini");
  const legumi = byCat("legumi");

  const olio = foods.find((f) => f.id === "olio_evo");
  const olioG = olio ? Math.round(Math.max(10, (input.macro.grassi * 0.25 * 100) / olio.grassi)) : 20;

  // --- Per-meal macro targets ---
  const frazPranzo = RIPARTIZIONE_PASTI.pranzo;
  const frazCena = RIPARTIZIONE_PASTI.cena;
  const protPranzo = Math.round(input.macro.proteine * frazPranzo);
  const carbPranzo = Math.round(input.macro.carboidrati * frazPranzo);
  const protCena = Math.round(input.macro.proteine * frazCena);
  const carbCena = Math.round(input.macro.carboidrati * frazCena);

  // --- Fixed meals (scale to colazione kcal target) ---
  const kcalColazione = input.kcalObiettivo * RIPARTIZIONE_PASTI.colazione;
  const yogurt = latticini.find((l) => l.id === "yogurt_greco");
  const avena = foods.find((f) => f.id === "avena");
  const colazioneItems: ItemPiano[] = [];
  if (yogurt) {
    colazioneItems.push({ n: yogurt.nome, g: yogurt.porzioneG, id: yogurt.id });
  }
  if (avena) {
    colazioneItems.push({ n: avena.nome, g: 40, id: avena.id });
  }
  if (frutta.length > 0) {
    const cf = frutta[V % frutta.length];
    colazioneItems.push({ n: cf.nome, g: 150, id: cf.id });
  }
  if (fruttaSecca.length > 0) {
    const cn = fruttaSecca[V % fruttaSecca.length];
    colazioneItems.push({ n: cn.nome, g: 15, id: cn.id });
  }
  // When items are few (e.g. IBS+lactose filters yogurt+avena), add cereali o uova
  if (!yogurt && !avena) {
    const uovaCol = protAll.find((f) => f.categoria === "uova");
    if (uovaCol && V % 2 === 1) {
      colazioneItems.unshift({ n: uovaCol.nome, g: uovaCol.porzioneG, id: uovaCol.id });
    } else {
      const riso = cereali.find((c) => c.id === "riso_basmati") || cereali[0];
      if (riso) {
        const g = porzionePerMacro(riso, "carb", kcalColazione * 0.35 / 4);
        colazioneItems.push({ n: riso.nome, g, id: riso.id });
      }
    }
    const fsIdx = colazioneItems.findIndex((it) => fruttaSecca.some((x) => x.id === it.id));
    if (fsIdx >= 0) colazioneItems[fsIdx].g = 25;
  }

  const colazione: SlotPiano = { slot: "Colazione", items: colazioneItems };
  const spuntino: SlotPiano = {
    slot: "Spuntino",
    items: fruttaSecca.length > 0
      ? [{ n: fruttaSecca[(V + 1) % fruttaSecca.length].nome, g: 15, id: fruttaSecca[(V + 1) % fruttaSecca.length].id }]
      : frutta.length > 0
        ? [{ n: frutta[(V + 1) % frutta.length].nome, g: 100, id: frutta[(V + 1) % frutta.length].id }]
        : [],
  };
  const merenda: SlotPiano = {
    slot: "Merenda",
    items: frutta.length > 0
      ? [{ n: frutta[(V + 2) % frutta.length].nome, g: 150, id: frutta[(V + 2) % frutta.length].id }]
      : [],
  };
  const olioSlot: SlotPiano = {
    slot: "Durante la giornata",
    items: olio ? [{ n: olio.nome, g: olioG, id: olio.id }] : [],
  };

  // --- 7 giorni ---
  const NOTE = [
    "Avvio settimana: pasti regolari, idratazione abbondante.",
    "Giornata equilibrata: verdure diverse dal giorno prima.",
    "Metà settimana: legumi se tollerati, altrimenti proteina magra.",
    "Omega-3: pesce o frutta secca per l'infiammazione.",
    "Fibra graduale: non esagerare se hai l'intestino sensibile.",
    "Weekend: segui il piano, concediti un piatto che ti piace.",
    "Domenica: cena libera nel rispetto delle indicazioni generali.",
  ];

  const giorni: GiornoPiano[] = [];

  for (let d = 0; d < 7; d++) {
    // Pranzo: carb + protein + verdura (offset con la variante V)
    const carbPranzoFood = cereali.length > 0 ? pick(cereali, d, V) : null;
    const protPranzoFood = protAll.length > 0 ? pick(protAll, d, V) : null;
    const verdPranzo = verdure.length > 0 ? pick(verdure, d, V) : null;

    const pranzoItems: ItemPiano[] = [];
    if (carbPranzoFood) {
      const g = porzionePerMacro(carbPranzoFood, "carb", carbPranzo * 0.95);
      pranzoItems.push({ n: carbPranzoFood.nome, g, id: carbPranzoFood.id });
    }
    if (protPranzoFood) {
      const g = porzionePerMacro(protPranzoFood, "prot", protPranzo * 0.95);
      pranzoItems.push({ n: protPranzoFood.nome, g, id: protPranzoFood.id });
    }
    if (verdPranzo) {
      pranzoItems.push({ n: verdPranzo.nome, g: verdPranzo.porzioneG, id: verdPranzo.id });
    }

    // Cena: protein (diversa) + verdura + carb più leggero
    const protCenaFood = protAll.length > 1
      ? pick(protAll, d, Math.floor(protAll.length / 2) + V)
      : protPranzoFood;
    const verdCena = verdure.length > 1
      ? pick(verdure, d, 3 + V)
      : verdPranzo;

    const cenaItems: ItemPiano[] = [];
    if (protCenaFood) {
      const g = porzionePerMacro(protCenaFood, "prot", protCena * 0.95);
      cenaItems.push({ n: protCenaFood.nome, g, id: protCenaFood.id });
    }
    if (verdCena) {
      cenaItems.push({ n: verdCena.nome, g: verdCena.porzioneG, id: verdCena.id });
    }
    // Smaller carb at dinner (patate or bread)
    const patate = foods.find((f) => f.id === "patate");
    const carbCenaFood = d % 2 === 0 && patate ? patate :
      cereali.length > 1 ? pick(cereali, d, 2 + V) : null;
    if (carbCenaFood && carbCena > 20) {
      const g = porzionePerMacro(carbCenaFood, "carb", carbCena * 0.75);
      cenaItems.push({ n: carbCenaFood.nome, g, id: carbCenaFood.id });
    }

    // Day 6 (domenica): cena libera
    const cenaFinale = d === 6
      ? [{ n: "Pasto libero", g: 0, id: "" }]
      : cenaItems;

    // Day 2 and 5: add legumi at lunch if available and not already there
    if ((d === 2 || d === 5) && legumi.length > 0) {
      const leg = pick(legumi, d);
      const alreadyHas = pranzoItems.some((it) => it.id === leg.id);
      if (!alreadyHas) {
        pranzoItems.push({ n: leg.nome, g: Math.round(leg.porzioneG * 0.5), id: leg.id });
      }
    }

    giorni.push({
      pranzo: pranzoItems,
      cena: cenaFinale,
      nota: NOTE[d],
    });
  }

  return { colazione, spuntino, merenda, olio: olioSlot, giorni };
}
