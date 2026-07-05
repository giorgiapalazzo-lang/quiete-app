"use client";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Home, CalendarDays, Camera, ChevronRight, ChevronLeft, X, Plus, Check,
  Flame, Droplet, Footprints, Sparkles, Clock, Pill as PillIcon, Ban, ShieldCheck, Info,
  RefreshCw, User, Activity, FileText, Apple, Wheat, Milk, Fish, Leaf,
  ArrowRightLeft, TrendingUp, Trash2, ShoppingCart, Dumbbell, Loader2,
  Wand2, Beef, UtensilsCrossed, Egg, Download, Share2, Zap, LogOut, Mail, Lock, Eye, EyeOff
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { calcolaSchema, ripartisciPasti, distribuisciMacro } from "../lib/nutrition/engine";
import { ARCHETIPI, suggerisciArchetipo } from "../lib/nutrition/archetipi";
import { generaPiano } from "../lib/nutrition/piano";
import { ALIMENTI, ALIMENTI_BY_ID, sostituti, diStagione, ruoloAlimento, nutriPerGrammi } from "../lib/nutrition/alimenti";
import { signUp, signIn, signOut, onAuthStateChange, getUser } from "../lib/supabase/auth";
import { getProfile, upsertProfile } from "../lib/supabase/profile";
import { isSupabaseConfigured } from "../lib/supabase/client";

/* ============================================================
   DESIGN TOKENS (Giorgia's brand system)
   ============================================================ */
const C = {
  ink: "#1E4B3A", green: "#6EBF74", greenL: "#E7EFE6", cream: "#F7F3EC",
  gold: "#D4A55A", card: "#FFFDF9", text: "#28352E", muted: "#7C8A80",
  line: "#E9E1D3", clay: "#C56A4E", ok: "#5E9E6A", goldBg: "#F6ECD8",
  carb: "#D4A55A", prot: "#C56A4E", fat: "#6EBF74"
};
const SH = "0 10px 30px -18px rgba(30,75,58,.30)";
const SHL = "0 26px 55px -28px rgba(30,75,58,.42)";
const serif = "'Playfair Display', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";

/* ============================================================
   NUTRITION ENGINE  (kcal + macros per 100 g)
   In prod this is the `foods` table in Supabase (verified values).
   ============================================================ */
const NUTRI = {
  pasta: [350, 12, 72, 1.5], riso: [350, 7, 78, 0.6], patate: [78, 2, 17, 0.1],
  paneGF: [270, 5, 52, 4], quinoa: [368, 14, 64, 6], saraceno: [343, 13, 72, 3.4],
  avena: [370, 13, 60, 7], pollo: [110, 23, 0, 1.5], merluzzo: [82, 18, 0, 0.7],
  salmone: [208, 20, 0, 13], gamberi: [85, 20, 0, 0.5], tonno: [116, 26, 0, 1],
  seppia: [80, 16, 1, 1], uova: [143, 13, 1, 10], yogurt: [59, 10, 4, 0.4],
  formaggio: [380, 30, 2, 28], bresaola: [150, 32, 0, 2], vitello: [130, 21, 0, 4.5],
  zucchine: [17, 1.2, 3, 0.3], carote: [41, 0.9, 10, 0.2], spinaci: [23, 2.9, 3.6, 0.4],
  verdura: [25, 1.5, 4, 0.3], kiwi: [61, 1, 15, 0.5], fragole: [32, 0.7, 7.7, 0.3],
  frutta: [55, 0.7, 13, 0.2], fruttaSecca: [620, 20, 10, 55], olio: [900, 0, 0, 100],
  legumi: [330, 24, 48, 1.5], cioccolato: [550, 8, 30, 42], tofu: [120, 12, 3, 7],
};
const NKEYS = [
  [/pasta/, "pasta"], [/ris(o|otto)/, "riso"], [/patat/, "patate"],
  [/pane|panino|gallett|cracker|wasa|grissini|frisell/, "paneGF"], [/quinoa/, "quinoa"],
  [/saracen/, "saraceno"], [/avena|porridge|fiocchi|pancake/, "avena"],
  [/miglio|amaranto|polenta|couscous|orzo|farro|cereal/, "riso"],
  [/pollo|tacchino/, "pollo"], [/merluzz|nasello|orata|spigola|branzino|pesce bianco|sogliol|dentice|spada/, "merluzzo"],
  [/salmon/, "salmone"], [/gamber/, "gamberi"], [/tonno|sgombro|sardin/, "tonno"],
  [/seppia|calamar|polpo|vongol|frutti di mare/, "seppia"],
  [/uov|omelette|frittat|albume/, "uova"], [/yogurt|kefir/, "yogurt"],
  [/parmigian|grana|feta|primo sale|formagg|ricotta|mozzarella|stracchino/, "formaggio"],
  [/bresaola|crudo|cotto|fesa|carpaccio|arrosto|prosciutto|lonza/, "bresaola"],
  [/vitello|manzo|maiale|carne|hamburger|polpett|salsicci/, "vitello"],
  [/zucchin/, "zucchine"], [/carot/, "carote"], [/spinac/, "spinaci"],
  [/verdur|insalata|ortagg|lattuga|finocch|pomodor|peperon|cetriol|melanzan/, "verdura"],
  [/kiwi/, "kiwi"], [/fragol|mirtill|lampon/, "fragole"],
  [/frutta|banana|arancia|uva|ananas|melone|mela|pera|clementin|papaya/, "frutta"],
  [/mandorl|noci|frutta secca|nocciol|semi|arachid/, "fruttaSecca"], [/olio|evo/, "olio"],
  [/lentic|ceci|fagiol|pisell|legum|fave/, "legumi"], [/cioccolat|nocciolata/, "cioccolato"],
  [/tofu|tempeh|seitan|soia/, "tofu"],
];
function nutriKey(name) {
  const n = (name || "").toLowerCase();
  for (const [re, k] of NKEYS) if (re.test(n)) return k;
  return null;
}
// returns { kcal, p, c, f, known }
function nutriFor(name, grams) {
  const k = nutriKey(name);
  if (!k || !grams) return { kcal: 0, p: 0, c: 0, f: 0, known: !!grams ? false : true };
  const [kc, p, c, f] = NUTRI[k];
  const r = grams / 100;
  return { kcal: kc * r, p: p * r, c: c * r, f: f * r, known: true };
}
function sumMeal(items) {
  return (items || []).reduce((a, it) => {
    const x = nutriFor(it.n, it.g);
    return { kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f };
  }, { kcal: 0, p: 0, c: 0, f: 0 });
}
const r0 = (x) => Math.round(x);
const catIcon = (cat) => {
  const m = { cereali: Wheat, legumi: Leaf, verdura: Leaf, frutta: Apple, carne: Beef, pesce: Fish, uova: Egg, latticini: Milk, frutta_secca: Leaf, grassi: Droplet, dolci: Sparkles, bevande: Droplet };
  const Ic = m[cat] || Leaf; return <Ic size={17} color={C.ink} />;
};
const fodmapLabel = (f) => (f === "basso" ? "FODMAP basso" : f === "medio" ? "FODMAP medio" : "FODMAP alto");
const r1 = (x) => Math.round(x * 10) / 10;
function sumPianoItems(items) {
  return (items || []).reduce((a, it) => {
    if (!it.g || !it.id) return a;
    const al = ALIMENTI_BY_ID[it.id];
    if (!al) return a;
    const r = it.g / 100;
    return { kcal: a.kcal + al.kcal * r, p: a.p + al.proteine * r, c: a.c + al.carboidrati * r, f: a.f + al.grassi * r };
  }, { kcal: 0, p: 0, c: 0, f: 0 });
}

/* ============================================================
   SEED DATA — modelled on Giorgia's real nutritionist plans.
   ============================================================ */
const EQUIV = {
  carboPranzo: { label: "Fonte di carboidrati — pranzo", base: { n: "Pasta", g: 60 }, alts: [
    { n: "Riso", g: 60, fodmap: "ok" }, { n: "Riso venere", g: 60, fodmap: "ok" }, { n: "Quinoa", g: 60, fodmap: "ok" },
    { n: "Grano saraceno", g: 70, fodmap: "ok" }, { n: "Miglio", g: 60, fodmap: "ok" }, { n: "Polenta", g: 60, fodmap: "ok" },
    { n: "Gnocchi di patate", g: 150, fodmap: "ok" }, { n: "Patate", g: 250, fodmap: "ok" },
    { n: "Pane integrale", g: 90, fodmap: "no" }, { n: "Orzo", g: 70, fodmap: "no" }] },
  carboCena: { label: "Fonte di carboidrati — cena", base: { n: "Patate", g: 150 }, alts: [
    { n: "Pane senza glutine", g: 60, fodmap: "ok" }, { n: "Gallette di riso o mais", g: 30, fodmap: "ok" },
    { n: "Riso in brodo", g: 40, fodmap: "ok" }, { n: "Wasa integrale", g: 40, fodmap: "no" }, { n: "Crackers", g: 30, fodmap: "no" }] },
  pescePranzo: { label: "Proteine — pranzo", base: { n: "Gamberetti", g: 180 }, alts: [
    { n: "Merluzzo o nasello", g: 180, fodmap: "ok" }, { n: "Orata", g: 110, fodmap: "ok" }, { n: "Salmone fresco", g: 70, fodmap: "ok" },
    { n: "Tonno al naturale", g: 120, fodmap: "ok" }, { n: "Polpo", g: 220, fodmap: "ok" }, { n: "Uova intere", g: 120, fodmap: "ok" },
    { n: "Pollo — petto", g: 130, fodmap: "ok" }, { n: "Bresaola", g: 80, fodmap: "ok" }, { n: "Lenticchie decorticate", g: 40, fodmap: "mod" }] },
  pesceCena: { label: "Proteine — cena", base: { n: "Pollo o tacchino", g: 150 }, alts: [
    { n: "Merluzzo o nasello", g: 250, fodmap: "ok" }, { n: "Orata", g: 150, fodmap: "ok" }, { n: "Pesce spada", g: 160, fodmap: "ok" },
    { n: "Salmone fresco", g: 100, fodmap: "ok" }, { n: "Seppia o calamari", g: 250, fodmap: "ok" }, { n: "Uova intere", g: 120, fodmap: "ok" },
    { n: "Vitello", g: 150, fodmap: "ok" }, { n: "Feta light", g: 90, fodmap: "ok" }] },
};

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const COLAZIONE = { slot: "Colazione", items: [{ n: "Yogurt greco senza lattosio", g: 150 }, { n: "Frutta di stagione", g: 100 }, { n: "Mandorle o noci", g: 10 }] };
const SP_AM = { slot: "Spuntino", items: [{ n: "Frutta secca", g: 10 }] };
const MERENDA = { slot: "Merenda", items: [{ n: "Frutta fresca consentita", g: 150 }] };
const EVO = { slot: "Durante la giornata", items: [{ n: "Olio EVO", g: 20 }] };
const WEEK = {
  Lun: { pranzo: [{ n: "Riso con zucchine", g: 60, eq: "carboPranzo" }, { n: "Tonno al naturale", g: 80, eq: "pescePranzo" }, { n: "Verdure", g: 150 }], cena: [{ n: "Pollo alla griglia", g: 150, eq: "pesceCena" }, { n: "Verdure di stagione", g: 200 }] },
  Mar: { pranzo: [{ n: "Pesce fresco a scelta", g: 150, eq: "pescePranzo" }, { n: "Verdure consentite", g: 200 }], cena: [{ n: "Pasta di grano saraceno", g: 60, eq: "carboPranzo" }, { n: "Verdure a scelta", g: 200 }] },
  Mer: { pranzo: [{ n: "Vitello alla griglia", g: 150, eq: "pesceCena" }, { n: "Panino gluten free", g: 50, eq: "carboCena" }, { n: "Verdure", g: 150 }], cena: [{ n: "Uova", g: 120, eq: "pesceCena" }, { n: "Riso con lenticchie decorticate", g: 60, eq: "carboPranzo" }] },
  Gio: { pranzo: [{ n: "Pesce fresco a scelta", g: 150, eq: "pescePranzo" }, { n: "Verdure consentite", g: 200 }], cena: [{ n: "Quinoa con ortaggi", g: 60, eq: "carboPranzo" }, { n: "Verdure a scelta", g: 200 }] },
  Ven: { pranzo: [{ n: "Bresaola o crudo", g: 100, eq: "pescePranzo" }, { n: "Panino gluten free", g: 50, eq: "carboCena" }, { n: "Insalata", g: 100 }], cena: [{ n: "Omelette", g: 120, eq: "pesceCena" }, { n: "Verdure di stagione", g: 200 }] },
  Sab: { pranzo: [{ n: "Riso con olio e parmigiano", g: 60, eq: "carboPranzo" }, { n: "Pesce fresco", g: 150, eq: "pescePranzo" }], cena: [{ n: "Pollo o lonza", g: 150, eq: "pesceCena" }, { n: "Panino gluten free", g: 50, eq: "carboCena" }, { n: "Verdure", g: 150 }] },
  Dom: { pranzo: [{ n: "Pasta GF con pomodoro e basilico", g: 60, eq: "carboPranzo" }, { n: "Insalata mista", g: 100 }], cena: [{ n: "Pasto libero", g: 0 }] },
};
const DAYNOTE = {
  Lun: "Avvio settimana. 2 kiwi al mattino, camminata dopo pranzo.", Mar: "Reflusso? Cena presto, porzioni piccole.",
  Mer: "Legumi solo decorticati (lenticchie rosse): più digeribili.", Gio: "Omega-3 dal pesce: barriera e infiammazione.",
  Ven: "Fibra la sera: psillio in acqua abbondante.", Sab: "Fuori casa: griglia semplice, no soffritti.",
  Dom: "Cena libera nel rispetto delle indicazioni generali.",
};

const FODMAP = {
  yes: [
    { c: "Cereali & carboidrati", i: "wheat", items: ["Riso", "Riso venere", "Mais", "Avena GF", "Grano saraceno", "Quinoa", "Amaranto", "Miglio", "Patate", "Gallette di riso/mais", "Pane senza glutine", "Pasta senza glutine"] },
    { c: "Frutta", i: "apple", items: ["Kiwi", "Fragole", "Lamponi", "Arancia", "Clementine", "Uva", "Ananas", "Melone", "Papaya", "Banana matura", "Limone"] },
    { c: "Verdura", i: "leaf", items: ["Zucchine", "Spinaci", "Carote", "Cetrioli", "Melanzane", "Peperoni", "Pomodori", "Zucca", "Finocchi", "Lattuga", "Bieta", "Fagiolini"] },
    { c: "Proteine & latticini", i: "fish", items: ["Pesce (tutti)", "Pollo, tacchino", "Vitello, manzo", "Uova", "Latte senza lattosio", "Yogurt senza lattosio", "Parmigiano", "Bresaola", "Tofu sodo"] },
    { c: "Grassi & extra", i: "droplet", items: ["Olio EVO", "Olio all'aglio infuso", "Zenzero", "Curcuma", "Sciroppo d'acero", "Lenticchie decorticate"] },
  ],
  no: [
    { c: "Cereali", i: "ban", items: ["Frumento", "Orzo", "Farro", "Segale", "Couscous", "Bulgur"] },
    { c: "Frutta", i: "ban", items: ["Mela", "Pera", "Anguria", "Mango", "Ciliegie", "Pesche", "Fichi", "Cachi", "Prugne", "Mirtilli", "Avocado"] },
    { c: "Verdura", i: "ban", items: ["Aglio", "Cipolla", "Scalogno", "Funghi", "Carciofi", "Asparagi", "Cavolfiore", "Broccoli", "Rucola", "Barbabietole"] },
    { c: "Legumi & latte", i: "ban", items: ["Ceci", "Fagioli", "Piselli", "Fave", "Soia", "Latte vaccino", "Latte di cocco/soia", "Yogurt normale"] },
    { c: "Dolcificanti & frutta secca", i: "ban", items: ["Miele", "Fruttosio", "Sorbitolo", "Xilitolo", "Pistacchi", "Anacardi", "Nocciole"] },
  ],
  snacks: [
    { c: "Dolci sicuri", i: "apple", items: ["150g frutta + 10g cioccolato ≥85%", "2 kiwi", "Pancake di banana", "Budino di chia", "Gelato senza lattosio"] },
    { c: "Salati", i: "utensils", items: ["Crackers di riso + 20g parmigiano", "Gallette + fesa di tacchino", "Olive", "Carote e cetrioli"] },
    { c: "Da bere", i: "droplet", items: ["Cappuccino di mandorla", "Tisana allo zenzero", "Golden milk", "Acqua e limone"] },
  ],
};

const FREQ = [
  { g: "Pesce", max: 4, icon: "fish" }, { g: "Carne bianca", max: 3, icon: "activity" },
  { g: "Legumi", max: 3, icon: "leaf" }, { g: "Uova", max: 2, icon: "apple" },
  { g: "Latticini", max: 3, icon: "milk" }, { g: "Carne rossa", max: 1, icon: "activity" },
];
const SUPPS = [
  { n: "Dicoflor IBS Plus", dose: "2 cpr il 1° mese, poi 1", when: "A stomaco vuoto", time: "08:00" },
  { n: "Vitamina D", dose: "2000 UI", when: "Con un pasto", time: "13:00" },
  { n: "Magnesio supremo", dose: "1 misurino", when: "In acqua tiepida", time: "22:00" },
];
const PLANS = [
  { id: "cafagna", name: "Low FODMAP · IBS", who: "Dr.ssa V. Cafagna", kcal: 1400, goal: "IBS + intolleranza al lattosio", condition: "Intestino", start: "13/04/2026", color: C.ink },
  { id: "paolini5", name: "Ricomposizione", who: "Dr.ssa M. Paolini", kcal: 1480, goal: "Ricomposizione corporea", condition: "Metabolismo", start: "26/04/2024", color: C.gold },
  { id: "gandolfi", name: "Piano Alternative", who: "Dr.ssa A. Gandolfi", kcal: 1500, goal: "Mantenimento con scambi", condition: "Mantenimento", start: "2023", color: C.green },
  { id: "2021", name: "Settimanale", who: "Piano 2021", kcal: 1450, goal: "Equilibrio", condition: "Storico", start: "04/01/2021", color: C.clay },
];
const RECIPES = [
  { n: "Porridge d'avena GF, kiwi e fragole", t: "Colazione · 8 min", ill: "porridge" },
  { n: "Riso, zucchine e pollo", t: "Pranzo · 25 min", ill: "bowl" },
  { n: "Merluzzo al vapore, patate e carote", t: "Cena · 25 min", ill: "fish" },
  { n: "Pancake di banana e avena", t: "Colazione · 12 min", ill: "porridge" },
  { n: "Quinoa, salmone e cetriolo", t: "Pranzo · 20 min", ill: "bowl" },
  { n: "Frittata di zucchine e insalata", t: "Cena · 18 min", ill: "eggs" },
];
const SYMPTOMS = [{ k: "gonfiore", label: "Gonfiore" }, { k: "dolore", label: "Dolore addominale" }, { k: "flatulenza", label: "Flatulenza" }, { k: "regolarita", label: "Regolarità intestinale" }];
const LEVELS = ["Nessuno", "Lieve", "Moderato", "Severo"];

// Weekly workout plan (integrated with the diet: training days -> more carbs at lunch)
// Programma anti-gonfiore: corpo libero leggero + HIIT corsa, basso impatto
// sull'intestino. Ogni esercizio ha un demo animato (vedi ExDemo).
const WORKOUT = [
  { day: "Lun", title: "Core anti-gonfiore", dur: "20 min", train: true, focus: "Pancia & core profondo", ex: [
    { n: "Respirazione diaframmatica", meta: "3 × 8 respiri", demo: "breath", tip: "Attiva il core profondo e sgonfia: inspira gonfiando la pancia, espira tirando l'ombelico dentro." },
    { n: "Dead bug", meta: "3 × 10 per lato", demo: "hold", tip: "Schiena a terra ben aderente, muovi braccio e gamba opposti." },
    { n: "Plank sugli avambracci", meta: "3 × 30\"", demo: "hold" },
    { n: "Bird-dog", meta: "3 × 10 per lato", demo: "hold" },
    { n: "Ponte glutei", meta: "3 × 15", demo: "squat" },
    { n: "Cat-cow", meta: "10 lenti", demo: "flow", tip: "Mobilizza la colonna e aiuta la motilità intestinale." },
  ] },
  { day: "Mar", title: "HIIT corsa leggera", dur: "22 min", train: true, focus: "Cardio a intervalli", ex: [
    { n: "Camminata di riscaldamento", meta: "5 min", demo: "walk" },
    { n: "Corsa — sforzo medio", meta: "8 × 30\"", demo: "run", tip: "Ritmo in cui riesci a parlare a fatica, non uno sprint." },
    { n: "Camminata di recupero", meta: "8 × 60\"", demo: "walk" },
    { n: "Defaticamento camminando", meta: "3 min", demo: "walk" },
  ] },
  { day: "Mer", title: "Mobilità & digestione", dur: "15 min", train: false, focus: "Recupero attivo", ex: [
    { n: "Cat-cow", meta: "10 lenti", demo: "flow" },
    { n: "Torsioni da seduta", meta: "8 per lato", demo: "flow", tip: "Le rotazioni del busto favoriscono il transito e sgonfiano." },
    { n: "Camminata rilassata", meta: "20 min", demo: "walk", tip: "Una camminata dopo i pasti riduce gonfiore e picchi glicemici." },
  ] },
  { day: "Gio", title: "Corpo libero total body", dur: "25 min", train: true, focus: "Forza leggera a casa", ex: [
    { n: "Squat a corpo libero", meta: "3 × 12", demo: "squat" },
    { n: "Affondi alternati", meta: "3 × 10 per gamba", demo: "squat" },
    { n: "Push-up sulle ginocchia", meta: "3 × 8", demo: "hold" },
    { n: "Mountain climber lenti", meta: "3 × 20", demo: "run", tip: "Controllati: avvicina il ginocchio al petto senza rimbalzare." },
    { n: "Plank up-down", meta: "3 × 8", demo: "hold" },
  ] },
  { day: "Ven", title: "HIIT corsa + core", dur: "25 min", train: true, focus: "Cardio + pancia", ex: [
    { n: "Corsa a intervalli", meta: "6 × 40\"", demo: "run" },
    { n: "Camminata di recupero", meta: "6 × 60\"", demo: "walk" },
    { n: "Jumping jack basso impatto", meta: "3 × 20", demo: "jump", tip: "Se saltare dà fastidio, apri le gambe con un passo laterale." },
    { n: "Plank", meta: "3 × 30\"", demo: "hold" },
  ] },
  { day: "Sab", title: "Camminata lunga", dur: "40 min", train: false, focus: "Cardio dolce", ex: [
    { n: "Camminata a passo svelto", meta: "35 min", demo: "walk" },
    { n: "Stretching completo", meta: "5 min", demo: "flow" },
  ] },
  { day: "Dom", title: "Riposo & respiro", dur: "10 min", train: false, focus: "Recupero", ex: [
    { n: "Respirazione diaframmatica", meta: "5 min", demo: "breath" },
    { n: "Passeggiata leggera", meta: "facoltativa", demo: "walk" },
  ] },
];

/* ============================================================
   SERVICE LAYER (swap makeLocalDb -> makeSupabaseDb)
   ============================================================ */
function makeLocalDb(setStore) {
  const tick = () => new Promise((r) => setTimeout(r, 50));
  return {
    diary: {
      async add(e) { await tick(); setStore((s) => ({ ...s, diary: [{ ...e, id: "d" + Date.now() }, ...s.diary] })); },
      async remove(id) { setStore((s) => ({ ...s, diary: s.diary.filter((x) => x.id !== id) })); },
    },
    measurements: { async add(m) { await tick(); setStore((s) => ({ ...s, measures: [...s.measures, { ...m, id: "m" + Date.now() }].sort((a, b) => a.ts - b.ts) })); } },
    plans: { async setActive(id) { setStore((s) => ({ ...s, activePlan: id })); } },
    meals: { async logNow(ts) { setStore((s) => ({ ...s, lastMeal: ts })); } },
    shopping: { async toggle(k) { setStore((s) => { const c = new Set(s.checked); c.has(k) ? c.delete(k) : c.add(k); return { ...s, checked: c }; }); } },
    // AI vision — in prod this can also run as a Supabase Edge Function
    async analyzePhoto(base64, mime) {
      const prompt = `Sei un dietista esperto. Analizza la foto di questo pasto e stima porzioni e valori nutrizionali usando il piatto e le posate come riferimento di scala. Rispondi SOLO con JSON valido, senza testo prima o dopo, in questo formato esatto:
{"piatto":"nome breve del piatto","alimenti":[{"nome":"alimento","grammi":120,"kcal":198,"proteine":30,"carboidrati":0,"grassi":8}],"totale":{"kcal":0,"proteine":0,"carboidrati":0,"grassi":0}}
Le grammature sono al netto degli scarti. Se nella foto non c'è cibo, restituisci "alimenti":[].`;
      // Chiama la serverless route: la chiave Anthropic resta lato server.
      const res = await fetch("/api/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mime, prompt }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Analisi non disponibile");
      }
      return await res.json();
    },
  };
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [store, setStore] = useState({
    profile: { name: "Giorgia", sex: "F", height: 152 },
    activePlan: "cafagna", checked: new Set(),
    diary: [],
    measures: [],
    lastMeal: null,
  });
  const db = useMemo(() => makeLocalDb(setStore), []);
  const toast = useToast();
  const [screen, setScreen] = useState("welcome");
  const [tab, setTab] = useState("oggi");
  const [sheet, setSheet] = useState(null);
  const [day, setDay] = useState(0);
  const [foodMode, setFoodMode] = useState("yes");
  const [tf, setTf] = useState("week");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingProfile, setPendingProfile] = useState(null);
  const isDesktop = useIsDesktop();
  const piano = useMemo(() => {
    const p = store.profile;
    if (!p.assessmentDone || !p.macro || !Number.isFinite(p.macro.proteine) || !Number.isFinite(p.kcalObiettivo)) return null;
    return generaPiano({ kcalObiettivo: p.kcalObiettivo, macro: p.macro, condizioni: p.condizioni || [], archetipo: p.archetipo || "mediterranea" });
  }, [store.profile]);
  const plan = useMemo(() => {
    const p = store.profile;
    if (p.assessmentDone && p.archetipo) {
      const arche = ARCHETIPI[p.archetipo];
      return { id: "assessment", name: arche?.nome || "Piano personalizzato", who: "Quiete", kcal: p.kcalObiettivo || 1800, goal: p.obiettivo || "", condition: p.archetipo, start: "", color: arche?.colore || C.ink };
    }
    return PLANS.find((pp) => pp.id === store.activePlan) || PLANS[0];
  }, [store.profile, store.activePlan]);
  const go = (t) => { setTab(t); window.scrollTo(0, 0); };

  useEffect(() => {
    let mounted = true;
    async function init() {
      // 1. Try Supabase session
      if (isSupabaseConfigured()) {
        try {
          const user = await getUser();
          if (user && mounted) {
            setAuthUser(user);
            const remote = await getProfile();
            if (remote && remote.assessmentDone) {
              setStore((s) => ({ ...s, profile: { ...s.profile, ...remote } }));
              try { localStorage.setItem("quiete_profile", JSON.stringify(remote)); } catch {}
              setScreen("app");
              setAuthLoading(false);
              return;
            }
          }
        } catch {}
      }
      // 2. Fallback to localStorage
      try {
        const raw = localStorage.getItem("quiete_profile");
        if (raw) {
          const p = JSON.parse(raw);
          if (mounted) {
            setStore((s) => ({ ...s, profile: { ...s.profile, ...p } }));
            if (p.assessmentDone || p.dietType) setScreen("app");
          }
        }
      } catch {}
      if (mounted) setAuthLoading(false);
    }
    init();
    // Listen for auth changes
    const { unsubscribe } = onAuthStateChange((user) => { if (mounted) setAuthUser(user || null); });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const saveProfile = useCallback((patch, next) => {
    setStore((s) => {
      const profile = { ...s.profile, ...patch };
      try { localStorage.setItem("quiete_profile", JSON.stringify(profile)); } catch {}
      // Sync to Supabase in background if authenticated
      if (authUser) {
        upsertProfile(profile).catch(() => {});
      }
      return { ...s, profile };
    });
    if (next) setScreen(next);
  }, [authUser]);

  // Cambio archetipo/dieta: le kcal restano sul fabbisogno (persona+obiettivo),
  // i macro carbo/grassi si ricalcolano secondo la forma della nuova dieta.
  const changeArchetipo = useCallback((id) => {
    setStore((s) => {
      const pr = s.profile;
      let macro = pr.macro, kcal = pr.kcalObiettivo;
      const archMacro = ARCHETIPI[id]?.macroPct;
      const engP = { sesso: pr.sesso, eta: pr.eta, altezzaCm: pr.altezza, pesoKg: pr.peso, attivita: pr.attivita, obiettivo: pr.obiettivo, allenamento: pr.allenamento, massaGrassaPct: pr.massaGrassa, condizioni: pr.condizioni || [] };
      try {
        if (Number.isFinite(pr.peso) && Number.isFinite(pr.altezza) && Number.isFinite(pr.eta)) {
          // Profilo completo: ricalcolo tutto (kcal + macro).
          const schema = calcolaSchema(engP, { archetipoMacroPct: archMacro });
          if (Number.isFinite(schema.kcalObiettivo) && Number.isFinite(schema.macro?.proteine)) {
            macro = schema.macro; kcal = schema.kcalObiettivo;
          }
        } else if (Number.isFinite(pr.peso) && Number.isFinite(kcal)) {
          // Legacy (manca età): ricalcolo solo i macro dalla kcal esistente.
          const d = distribuisciMacro(kcal, engP, archMacro);
          if (Number.isFinite(d.macro?.proteine)) macro = d.macro;
        }
      } catch {}
      const profile = { ...pr, archetipo: id, macro, kcalObiettivo: kcal };
      try { localStorage.setItem("quiete_profile", JSON.stringify(profile)); } catch {}
      if (authUser) upsertProfile(profile).catch(() => {});
      return { ...s, profile };
    });
  }, [authUser]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setAuthUser(null);
    try { localStorage.removeItem("quiete_profile"); } catch {}
    setStore((s) => ({ ...s, profile: { name: "Giorgia", sex: "F", height: 152 } }));
    setScreen("welcome");
  }, []);

  if (authLoading) {
    return (
      <OnbBg>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <Seed size={64} />
          <div style={{ fontFamily: serif, fontSize: 36, fontWeight: 600, color: C.ink }}>Quiete</div>
          <Loader2 size={24} color={C.muted} className="qspin" />
        </div>
      </OnbBg>
    );
  }

  if (screen === "welcome") return <Welcome onStart={() => setScreen("assessment")} onLogin={() => setScreen("login")} isDesktop={isDesktop} />;
  if (screen === "login")
    return (
      <LoginScreen
        isDesktop={isDesktop}
        onBack={() => setScreen("welcome")}
        onSuccess={async (user) => {
          setAuthUser(user);
          const remote = await getProfile();
          if (remote) {
            setStore((s) => ({ ...s, profile: { ...s.profile, ...remote } }));
            try { localStorage.setItem("quiete_profile", JSON.stringify(remote)); } catch {}
          }
          setScreen("app");
        }}
      />
    );
  if (screen === "assessment")
    return (
      <Assessment
        initial={store.profile}
        isDesktop={isDesktop}
        onDone={(d) => {
          if (isSupabaseConfigured() && !authUser) {
            setPendingProfile(d);
            setScreen("signup");
          } else {
            saveProfile(d, "app");
          }
        }}
      />
    );
  if (screen === "signup")
    return (
      <SignupScreen
        email={pendingProfile?.email || ""}
        isDesktop={isDesktop}
        onBack={() => setScreen("assessment")}
        onSkip={() => { saveProfile(pendingProfile, "app"); setPendingProfile(null); }}
        onSuccess={async (user) => {
          setAuthUser(user);
          const profile = { ...store.profile, ...pendingProfile };
          setStore((s) => ({ ...s, profile }));
          try { localStorage.setItem("quiete_profile", JSON.stringify(profile)); } catch {}
          await upsertProfile(profile).catch(() => {});
          setPendingProfile(null);
          setScreen("app");
        }}
      />
    );

  if (isDesktop)
    return (
      <DesktopShell
        {...{ tab, go, plan, store, db, setSheet, sheet, day, setDay, tf, setTf, toast, piano, authUser, handleLogout, changeArchetipo }}
      />
    );

  return (
    <Frame>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(247,243,236,.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.line}`, padding: "13px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Seed size={30} /><span style={{ fontFamily: serif, fontWeight: 600, fontSize: 21, color: C.ink }}>Quiete</span></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setSheet({ type: "plans" })} style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.line}`, borderRadius: 100, padding: "7px 12px", boxShadow: SH, cursor: "pointer", fontFamily: sans }}>
              <span style={{ width: 9, height: 9, borderRadius: 100, background: plan.color }} /><span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{plan.name}</span><ChevronRight size={14} color={C.muted} />
            </button>
            <button onClick={() => setSheet({ type: "profile" })} style={{ width: 38, height: 38, borderRadius: 100, background: C.ink, color: "#fff", border: "none", cursor: "pointer", fontFamily: serif, fontWeight: 600, fontSize: 16 }}>{store.profile.name[0]}</button>
          </div>
        </div>
      </header>

      <main style={{ padding: "20px 16px 100px", minHeight: "60vh" }}>
        {tab === "oggi" && <Oggi {...{ plan, store, db, setSheet, go, toast, day, piano }} />}
        {tab === "piano" && <Piano {...{ day, setDay, setSheet, piano, store }} />}
        {tab === "spesa" && <Spesa {...{ store, db, tf, setTf, piano }} />}
        {tab === "allenamento" && <Allenamento />}
        {tab === "diario" && <Diario {...{ store, db, setSheet, toast }} />}
      </main>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, background: "rgba(255,253,249,.96)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 440, margin: "0 auto", display: "flex" }}>
          {[["oggi", Home, "Oggi"], ["piano", CalendarDays, "Piano"], ["spesa", ShoppingCart, "Spesa"], ["allenamento", Dumbbell, "Workout"], ["diario", Camera, "Diario"]].map(([k, Ic, l]) => (
            <button key={k} onClick={() => go(k)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 9px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: tab === k ? C.ink : C.muted, position: "relative", fontFamily: sans }}>
              {tab === k && <span style={{ position: "absolute", top: 0, width: 22, height: 3, borderRadius: 100, background: C.ink }} />}
              <Ic size={21} /><span style={{ fontSize: 10, fontWeight: 600 }}>{l}</span>
            </button>
          ))}
        </div>
      </nav>

      {sheet && <Sheet sheet={sheet} close={() => setSheet(null)} ctx={{ plan, store, db, toast, setSheet, authUser, handleLogout, changeArchetipo }} />}
      {toast.node}
    </Frame>
  );
}

/* ============================================================
   WELCOME
   ============================================================ */
const OnbBg = ({ children }) => (
  <div style={{ minHeight: "100dvh", background: C.cream, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, color: C.text, padding: "40px 0" }}>
    {children}
  </div>
);
const field = { width: "100%", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 14px", fontSize: 15, fontFamily: sans, color: C.text, outline: "none" };
const fieldLabel = { fontSize: 12.5, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" };

function Welcome({ onStart, onLogin, isDesktop }) {
  const feats = [
    ["Nutrienti sempre", "Kcal e macro di ogni pasto e del giorno.", Flame],
    ["Foto con l'AI", "Fotografi il piatto, stima grammature e valori.", Wand2],
    ["Piano & allenamento", "Diete, spesa e workout che si parlano.", Dumbbell],
  ];
  return (
    <OnbBg>
      <div style={{ width: "100%", maxWidth: isDesktop ? 980 : 400, margin: "0 auto", display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "1.05fr 0.95fr" : undefined, gap: isDesktop ? 48 : 0, alignItems: "center", padding: isDesktop ? "0 40px" : "0 28px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: isDesktop ? "flex-start" : "center", textAlign: isDesktop ? "left" : "center" }}>
          <Seed size={isDesktop ? 64 : 78} />
          <div style={{ fontFamily: serif, fontSize: isDesktop ? 52 : 44, fontWeight: 600, color: C.ink, marginTop: 18 }}>Quiete</div>
          <div style={{ fontFamily: sans, fontSize: 11, letterSpacing: ".28em", color: C.gold, fontWeight: 600, marginTop: 4 }}>SALUTE INTESTINALE</div>
          <p style={{ fontFamily: serif, fontSize: isDesktop ? 26 : 21, color: C.ink, lineHeight: 1.35, maxWidth: 360, margin: "22px 0 8px", fontWeight: 500 }}>Il tuo piano, i tuoi macro, i tuoi progressi. In un posto solo.</p>
          <button onClick={onStart} style={{ ...btnPrimary, width: isDesktop ? "auto" : "100%", padding: isDesktop ? "15px 30px" : "15px 22px", marginTop: 16 }}>Inizia il tuo percorso <ChevronRight size={19} /></button>
          {isSupabaseConfigured() && (
            <button onClick={onLogin} style={{ ...btnGhost, width: isDesktop ? "auto" : "100%", justifyContent: "center", marginTop: 10 }}>
              <Mail size={15} /> Hai già un account? Accedi
            </button>
          )}
          <div style={{ display: "flex", gap: 7, marginTop: 20 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: i === 0 ? 20 : 8, height: 8, borderRadius: 100, background: i === 0 ? C.ink : C.line }} />)}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: isDesktop ? 0 : 28 }}>
          {feats.map(([t, s, Ic], i) => (
            <div key={i} style={{ display: "flex", gap: 14, textAlign: "left", background: C.card, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16, boxShadow: SH }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Ic size={20} color={C.ink} /></div>
              <div><div style={{ fontWeight: 600, fontSize: 14.5, color: C.text }}>{t}</div><div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{s}</div></div>
            </div>
          ))}
        </div>
      </div>
    </OnbBg>
  );
}


/* ============================================================
   ASSESSMENT — percorso nutrizionale reale (sostituisce iscrizione + quiz)
   Raccoglie i dati, calcola BMR/TDEE/macros col motore, suggerisce
   l'archetipo e mostra lo schema orientativo. NON è una prescrizione.
   ============================================================ */
const ATTIVITA_OPT = [
  ["sedentario", "Sedentaria", "Lavoro da seduta, poco movimento"],
  ["leggero", "Leggera", "Cammino, 1–3 allenamenti leggeri"],
  ["moderato", "Moderata", "3–5 allenamenti a settimana"],
  ["attivo", "Attiva", "6–7 allenamenti intensi"],
  ["molto_attivo", "Molto attiva", "Atleta o doppie sessioni"],
];
const OBIETTIVO_OPT = [
  ["dimagrimento", "Perdere peso", Flame],
  ["mantenimento", "Mantenermi in forma", ShieldCheck],
  ["massa", "Aumentare massa muscolare", Dumbbell],
  ["ricomposizione", "Ricomposizione corporea", Activity],
  ["salute_intestinale", "Stare meglio con l'intestino", Leaf],
];
const COND_OPT = [
  ["ibs", "Colon irritabile / gonfiore"],
  ["intolleranza_lattosio", "Intolleranza al lattosio"],
  ["celiachia", "Celiachia"],
  ["diabete_t2", "Diabete tipo 2"],
  ["ipertensione", "Ipertensione"],
  ["dislipidemia", "Colesterolo / trigliceridi alti"],
  ["menopausa", "Menopausa"],
  ["gravidanza", "Gravidanza"],
  ["vegetariano", "Vegetariana"],
  ["vegano", "Vegana"],
];
const ALLEN_OPT = [["nessuno", "Nessuno"], ["cardio", "Cardio"], ["forza", "Pesi / forza"], ["misto", "Misto"]];

const PickCard = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: active ? C.greenL : C.card, border: `1.5px solid ${active ? C.green : C.line}`, borderRadius: 15, padding: "13px 15px", cursor: "pointer", fontFamily: sans, textAlign: "left", boxShadow: active ? "none" : SH, transition: "all .12s" }}>
    {children}
  </button>
);

function Assessment({ initial, onDone, isDesktop }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: initial?.name && initial.name !== "Giorgia" ? initial.name : "",
    email: initial?.email || "",
    sesso: initial?.sesso || "",
    eta: initial?.eta || "",
    altezza: initial?.altezza || "",
    peso: initial?.peso || "",
    massaGrassa: initial?.massaGrassa || "",
    attivita: initial?.attivita || "",
    obiettivo: initial?.obiettivo || "",
    allenamento: initial?.allenamento || "nessuno",
    condizioni: initial?.condizioni || [],
  });
  const [err, setErr] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleCond = (c) =>
    setF((s) => ({ ...s, condizioni: s.condizioni.includes(c) ? s.condizioni.filter((x) => x !== c) : [...s.condizioni, c] }));

  const STEPS = 5; // 0 identità · 1 corpo · 2 obiettivo · 3 condizioni · 4 risultato
  const next = () => { setErr(""); setStep((s) => s + 1); };
  const back = () => { setErr(""); setStep((s) => Math.max(0, s - 1)); };

  const validateStep = () => {
    if (step === 0) {
      if (!f.name.trim()) return "Inserisci il tuo nome";
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return "Inserisci un'email valida";
      if (!f.sesso) return "Seleziona il sesso biologico (serve al calcolo metabolico)";
    }
    if (step === 1) {
      const eta = +f.eta, h = +f.altezza, p = +f.peso;
      if (!(eta >= 14 && eta <= 100)) return "Inserisci un'età valida (14–100)";
      if (!(h >= 120 && h <= 220)) return "Inserisci un'altezza valida in cm";
      if (!(p >= 30 && p <= 250)) return "Inserisci un peso valido in kg";
      if (f.massaGrassa !== "" && !(+f.massaGrassa >= 3 && +f.massaGrassa <= 60)) return "Massa grassa non valida (3–60%). Lasciala vuota se non la conosci.";
      if (!f.attivita) return "Seleziona il tuo livello di attività";
    }
    if (step === 2 && !f.obiettivo) return "Scegli un obiettivo";
    return "";
  };
  const advance = () => {
    const e = validateStep();
    if (e) return setErr(e);
    next();
  };

  // Calcolo (solo quando serve).
  const result = useMemo(() => {
    if (step < 4) return null;
    // Prima l'archetipo, così i macro seguono la forma della dieta (§5/§6 riferimento).
    const arch = suggerisciArchetipo({ obiettivo: f.obiettivo, condizioni: f.condizioni });
    const profilo = {
      sesso: f.sesso, eta: +f.eta, altezzaCm: +f.altezza, pesoKg: +f.peso,
      massaGrassaPct: f.massaGrassa ? +f.massaGrassa : undefined,
      attivita: f.attivita, obiettivo: f.obiettivo, allenamento: f.allenamento,
      condizioni: f.condizioni,
    };
    const schema = calcolaSchema(profilo, { archetipoMacroPct: ARCHETIPI[arch.consigliato].macroPct });
    const pasti = ripartisciPasti(schema.kcalObiettivo, schema.macro);
    return { schema, arch, pasti };
  }, [step, f]);

  const finish = () => {
    onDone({
      name: f.name, email: f.email, sesso: f.sesso, eta: +f.eta, altezza: +f.altezza, peso: +f.peso,
      massaGrassa: f.massaGrassa ? +f.massaGrassa : undefined,
      attivita: f.attivita, obiettivo: f.obiettivo, allenamento: f.allenamento, condizioni: f.condizioni,
      // esiti calcolati (lead data + piano)
      kcalObiettivo: result.schema.kcalObiettivo, macro: result.schema.macro,
      archetipo: result.arch.consigliato, archetipoNome: ARCHETIPI[result.arch.consigliato].nome,
      richiedeProfessionista: result.arch.richiedeProfessionista,
      assessmentDone: true,
    });
  };

  const wrap = { width: "100%", maxWidth: isDesktop ? 620 : 420, margin: "0 auto", padding: "0 24px" };
  const title = (t) => <h1 style={{ fontFamily: serif, fontSize: isDesktop ? 30 : 24, fontWeight: 600, color: C.ink, margin: "2px 0 18px", lineHeight: 1.15 }}>{t}</h1>;

  return (
    <OnbBg>
      <div style={wrap}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {Array.from({ length: STEPS }).map((_, i) => <span key={i} style={{ flex: 1, height: 5, borderRadius: 100, background: i <= step ? C.ink : C.line }} />)}
        </div>

        {/* STEP 0 — identità */}
        {step === 0 && (
          <>
            <Eyebrow>Iniziamo · 1/5</Eyebrow>
            {title("Chi sei")}
            <div style={{ marginBottom: 14 }}><label style={fieldLabel}>Nome *</label><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Come ti chiami" style={field} /></div>
            <div style={{ marginBottom: 14 }}><label style={fieldLabel}>Email *</label><input value={f.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="tu@esempio.it" style={field} /></div>
            <label style={fieldLabel}>Sesso biologico *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["donna", "Donna"], ["uomo", "Uomo"]].map(([k, l]) => (
                <PickCard key={k} active={f.sesso === k} onClick={() => set("sesso", k)}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{l}</span>
                </PickCard>
              ))}
            </div>
            <p style={{ fontSize: 11.5, color: C.muted, marginTop: 8 }}>Serve alla formula del metabolismo (Mifflin-St Jeor), che differisce tra uomo e donna.</p>
          </>
        )}

        {/* STEP 1 — corpo + attività */}
        {step === 1 && (
          <>
            <Eyebrow>Il tuo corpo · 2/5</Eyebrow>
            {title("Qualche misura")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[["eta", "Età", "anni"], ["altezza", "Altezza", "cm"], ["peso", "Peso", "kg"]].map(([k, l, u]) => (
                <div key={k}><label style={fieldLabel}>{l}</label><input value={f[k]} onChange={(e) => set(k, e.target.value)} type="number" inputMode="numeric" placeholder={u} style={field} /></div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={fieldLabel}>Massa grassa % <span style={{ color: C.muted, fontWeight: 400 }}>· opzionale</span></label>
              <input value={f.massaGrassa} onChange={(e) => set("massaGrassa", e.target.value)} type="number" inputMode="decimal" placeholder="es. 22 (dalla bilancia impedenziometrica / BIA)" style={field} />
              <p style={{ fontSize: 11.5, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>Se la conosci (BIA, plicometria, DEXA) usiamo la formula Katch-McArdle, più precisa del calcolo su età/altezza. Lascia vuoto se non la sai.</p>
            </div>
            <label style={fieldLabel}>Quanto ti muovi?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {ATTIVITA_OPT.map(([k, l, d]) => (
                <PickCard key={k} active={f.attivita === k} onClick={() => set("attivita", k)}>
                  <div><div style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{l}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{d}</div></div>
                </PickCard>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — obiettivo + allenamento */}
        {step === 2 && (
          <>
            <Eyebrow>Il tuo obiettivo · 3/5</Eyebrow>
            {title("Cosa vuoi ottenere")}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {OBIETTIVO_OPT.map(([k, l, Ic]) => (
                <PickCard key={k} active={f.obiettivo === k} onClick={() => set("obiettivo", k)}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: C.greenL, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Ic size={18} color={C.ink} /></span>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{l}</span>
                </PickCard>
              ))}
            </div>
            <label style={fieldLabel}>Ti alleni?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {ALLEN_OPT.map(([k, l]) => (
                <PickCard key={k} active={f.allenamento === k} onClick={() => set("allenamento", k)}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{l}</span>
                </PickCard>
              ))}
            </div>
          </>
        )}

        {/* STEP 3 — condizioni */}
        {step === 3 && (
          <>
            <Eyebrow>Attenzioni · 4/5</Eyebrow>
            {title("Hai condizioni da considerare?")}
            <p style={{ fontSize: 13, color: C.muted, marginTop: -8, marginBottom: 16 }}>Seleziona quelle che ti riguardano. Puoi anche saltare.</p>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 9 }}>
              {COND_OPT.map(([k, l]) => (
                <PickCard key={k} active={f.condizioni.includes(k)} onClick={() => toggleCond(k)}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${f.condizioni.includes(k) ? C.green : C.line}`, background: f.condizioni.includes(k) ? C.green : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{f.condizioni.includes(k) && <Check size={13} color="#fff" />}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{l}</span>
                </PickCard>
              ))}
            </div>
          </>
        )}

        {/* STEP 4 — risultato */}
        {step === 4 && result && (
          <AssessmentResult f={f} result={result} isDesktop={isDesktop} />
        )}

        {/* NAV */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && step < 4 && <button onClick={back} style={{ ...btnGhost, marginTop: 0 }}><ChevronLeft size={15} /> Indietro</button>}
          {step < 3 && <button onClick={advance} style={{ ...btnPrimary, flex: 1 }}>Continua <ChevronRight size={19} /></button>}
          {step === 3 && <button onClick={advance} style={{ ...btnPrimary, flex: 1 }}>Vedi il tuo schema <ChevronRight size={19} /></button>}
          {step === 4 && <button onClick={finish} style={{ ...btnPrimary, flex: 1 }}>Entra in Quiete <ChevronRight size={19} /></button>}
        </div>
        {err && <div style={{ color: C.clay, fontSize: 13, marginTop: 12, fontWeight: 600 }}>{err}</div>}
        {step === 4 && <button onClick={back} style={{ ...btnGhost, width: "100%", justifyContent: "center" }}>Modifica i dati</button>}
      </div>
    </OnbBg>
  );
}

function AssessmentResult({ f, result, isDesktop }) {
  const { schema, arch, pasti } = result;
  const arche = ARCHETIPI[arch.consigliato];
  const macroRow = [
    ["Proteine", schema.macro.proteine, schema.percentuali.proteine, C.prot],
    ["Carboidrati", schema.macro.carboidrati, schema.percentuali.carboidrati, C.carb],
    ["Grassi", schema.macro.grassi, schema.percentuali.grassi, C.fat],
  ];
  return (
    <>
      <Eyebrow>Il tuo schema · 5/5</Eyebrow>
      <h1 style={{ fontFamily: serif, fontSize: isDesktop ? 30 : 25, fontWeight: 600, color: C.ink, margin: "2px 0 4px", lineHeight: 1.15 }}>Ciao {f.name}, ecco il tuo punto di partenza</h1>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Calcolato sui tuoi dati con le linee guida ufficiali. È uno schema orientativo, non una dieta prescritta.</p>

      {/* kcal + macro */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: SH, padding: 18, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div><div style={{ fontSize: 12, color: C.muted }}>Fabbisogno giornaliero</div><div style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, color: C.ink }}>{schema.kcalObiettivo} <span style={{ fontSize: 16, color: C.muted }}>kcal</span></div></div>
          <div style={{ textAlign: "right", fontSize: 11.5, color: C.muted, lineHeight: 1.6 }}>
            <div>Metabolismo basale <b style={{ color: C.text }}>{schema.bmr}</b></div>
            <div>Con attività <b style={{ color: C.text }}>{schema.tdee}</b></div>
            {schema.deltaKcal !== 0 && <div>Obiettivo <b style={{ color: schema.deltaKcal < 0 ? C.clay : C.ok }}>{schema.deltaKcal > 0 ? "+" : ""}{schema.deltaKcal}</b></div>}
          </div>
        </div>
        {macroRow.map(([l, g, pct, col]) => (
          <div key={l} style={{ marginBottom: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: C.text, fontWeight: 600 }}>{l}</span><span style={{ color: C.muted }}>{g} g · {pct}%</span></div>
            <div style={{ height: 7, borderRadius: 100, background: C.line, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 100 }} /></div>
          </div>
        ))}
      </div>

      {/* archetipo consigliato */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: SH, padding: 18, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: 100, background: arche.colore }} />
          <div><div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Approccio consigliato</div><div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink }}>{arche.nome}</div></div>
        </div>
        <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{arche.descrizione}</p>
      </div>

      {/* ripartizione pasti */}
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, boxShadow: SH, padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>Come distribuire le calorie nella giornata</div>
        {pasti.map((p) => (
          <div key={p.pasto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, textTransform: "capitalize" }}>{p.pasto}</span>
            <span style={{ fontSize: 12.5, color: C.muted }}>{p.kcal} kcal · P{p.macro.proteine} C{p.macro.carboidrati} G{p.macro.grassi}</span>
          </div>
        ))}
      </div>

      {/* note divulgative */}
      {schema.note.length > 0 && (
        <div style={{ background: C.goldBg, borderRadius: 16, padding: "13px 15px", marginBottom: 12 }}>
          {schema.note.map((n, i) => <div key={i} style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5, display: "flex", gap: 8, marginBottom: i < schema.note.length - 1 ? 8 : 0 }}><Info size={15} color={C.gold} style={{ flex: "0 0 auto", marginTop: 1 }} /><span>{n}</span></div>)}
        </div>
      )}

      {/* CTA nutrizionista se ci sono condizioni cliniche */}
      {arch.richiedeProfessionista.length > 0 && (
        <div style={{ background: C.ink, borderRadius: 18, padding: 18, marginBottom: 12, color: "#fff" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}><ShieldCheck size={20} /><div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600 }}>Qui serve un professionista</div></div>
          <p style={{ fontSize: 13, opacity: .92, lineHeight: 1.5 }}>Hai indicato condizioni che richiedono un piano personalizzato da un esperto. I nutrizionisti del team Quiete possono seguirti in sicurezza.</p>
        </div>
      )}

      {/* disclaimer sempre */}
      <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: C.muted, lineHeight: 1.5, padding: "0 2px" }}>
        <Info size={14} style={{ flex: "0 0 auto", marginTop: 1 }} />
        <span>Quiete fornisce linee guida educative basate su LARN/SINU e CREA. Non sostituisce il parere di un medico, biologo nutrizionista o dietista.</span>
      </div>
    </>
  );
}

/* ============================================================
   AUTH SCREENS — Login + Signup
   ============================================================ */
function LoginScreen({ isDesktop, onBack, onSuccess }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !pw) return setErr("Inserisci email e password");
    setLoading(true); setErr("");
    try {
      const { user } = await signIn(email, pw);
      await onSuccess(user);
    } catch (ex) {
      setErr(ex.message === "Invalid login credentials" ? "Email o password non corretti" : ex.message || "Errore di accesso");
    } finally { setLoading(false); }
  };

  return (
    <OnbBg>
      <div style={{ width: "100%", maxWidth: isDesktop ? 440 : 400, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Seed size={44} />
          <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, color: C.ink }}>Accedi</div>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={17} color={C.muted} style={{ position: "absolute", left: 14, top: 14 }} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@esempio.it" style={{ ...field, paddingLeft: 40 }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={17} color={C.muted} style={{ position: "absolute", left: 14, top: 14 }} />
              <input value={pw} onChange={(e) => setPw(e.target.value)} type={showPw ? "text" : "password"} placeholder="La tua password" style={{ ...field, paddingLeft: 40, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: C.muted }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {err && <div style={{ color: C.clay, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={18} className="qspin" /> Accesso in corso...</> : <>Accedi <ChevronRight size={19} /></>}
          </button>
        </form>
        <button onClick={onBack} style={{ ...btnGhost, width: "100%", justifyContent: "center" }}><ChevronLeft size={15} /> Torna alla home</button>
      </div>
    </OnbBg>
  );
}

function SignupScreen({ email: initialEmail, isDesktop, onBack, onSkip, onSuccess }) {
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setErr("La password deve essere di almeno 6 caratteri");
    setLoading(true); setErr("");
    try {
      const { user, session } = await signUp(initialEmail, pw);
      if (!session) {
        setDone(true);
      } else {
        await onSuccess(user);
      }
    } catch (ex) {
      setErr(ex.message || "Errore nella registrazione");
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <OnbBg>
        <div style={{ width: "100%", maxWidth: isDesktop ? 440 : 400, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Mail size={28} color={C.ink} /></div>
          <h1 style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>Controlla la tua email</h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 24 }}>Abbiamo inviato un link di conferma a <b style={{ color: C.text }}>{initialEmail}</b>. Clicca il link per attivare il tuo account.</p>
          <button onClick={onSkip} style={btnPrimary}>Continua nell'app <ChevronRight size={19} /></button>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>I tuoi dati sono salvati localmente. Verranno sincronizzati dopo la conferma dell'email.</p>
        </div>
      </OnbBg>
    );
  }

  return (
    <OnbBg>
      <div style={{ width: "100%", maxWidth: isDesktop ? 440 : 400, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <Seed size={44} />
          <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600, color: C.ink }}>Salva i tuoi dati</div>
        </div>
        <p style={{ fontSize: 13.5, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>Crea un account per accedere da qualsiasi dispositivo. Ci serve solo una password.</p>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <Mail size={18} color={C.muted} />
          <div>
            <div style={{ fontSize: 11, color: C.muted }}>Il tuo account</div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{initialEmail}</div>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Scegli una password</label>
            <div style={{ position: "relative" }}>
              <Lock size={17} color={C.muted} style={{ position: "absolute", left: 14, top: 14 }} />
              <input value={pw} onChange={(e) => setPw(e.target.value)} type={showPw ? "text" : "password"} placeholder="Minimo 6 caratteri" style={{ ...field, paddingLeft: 40, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: C.muted }}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {err && <div style={{ color: C.clay, fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{err}</div>}
          <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Loader2 size={18} className="qspin" /> Creazione in corso...</> : <><ShieldCheck size={18} /> Crea account</>}
          </button>
        </form>
        <button onClick={onSkip} style={{ ...btnGhost, width: "100%", justifyContent: "center" }}>Continua senza account</button>
        <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Senza account i dati restano solo su questo dispositivo.</p>
      </div>
    </OnbBg>
  );
}

/* ============================================================
   OGGI
   ============================================================ */
function Oggi({ plan, store, db, setSheet, go, toast, day, piano, isDesktop }) {
  const fasting = useFasting(store.lastMeal);
  const today = new Date().toDateString();
  const logged = store.diary.filter((e) => new Date(e.ts).toDateString() === today && e.nutri);
  const tot = logged.reduce((a, e) => ({ kcal: a.kcal + (e.nutri.kcal || 0), p: a.p + (e.nutri.p || 0), c: a.c + (e.nutri.c || 0), f: a.f + (e.nutri.f || 0) }), { kcal: 0, p: 0, c: 0, f: 0 });
  const profile = store.profile;
  const kcalTarget = Number.isFinite(profile.kcalObiettivo) ? profile.kcalObiettivo : plan.kcal;
  const macroOk = profile.macro && Number.isFinite(profile.macro.proteine) && Number.isFinite(profile.macro.carboidrati) && Number.isFinite(profile.macro.grassi);
  const planTot = macroOk
    ? { kcal: kcalTarget, p: profile.macro.proteine, c: profile.macro.carboidrati, f: profile.macro.grassi }
    : sumMeal([...COLAZIONE.items, ...SP_AM.items, ...WEEK[DAYS[day]].pranzo, ...MERENDA.items, ...WEEK[DAYS[day]].cena, ...EVO.items]);

  const nutritionCard = (
    <Card style={{ padding: 18 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <KcalRing value={tot.kcal} target={kcalTarget} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 10 }}>Registrato oggi</div>
          <MacroBar label="Proteine" g={tot.p} target={planTot.p} color={C.prot} />
          <MacroBar label="Carboidrati" g={tot.c} target={planTot.c} color={C.carb} />
          <MacroBar label="Grassi" g={tot.f} target={planTot.f} color={C.fat} />
        </div>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, fontSize: 12.5, color: C.muted, display: "flex", justifyContent: "space-between" }}>
        <span>Obiettivo giornaliero</span><span style={{ fontWeight: 600, color: C.ink }}>≈ {r0(planTot.kcal)} kcal · P{r0(planTot.p)} C{r0(planTot.c)} G{r0(planTot.f)}</span>
      </div>
    </Card>
  );

  const aiBtn = (
    <button onClick={() => setSheet({ type: "ai" })} style={{ width: "100%", border: "none", cursor: "pointer", borderRadius: 22, padding: 18, marginBottom: 14, color: "#fff", background: C.ink, boxShadow: SHL, position: "relative", overflow: "hidden", textAlign: "left", fontFamily: sans }}>
      <BotanicalBg />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 50, height: 50, borderRadius: 15, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><Wand2 size={26} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 19, fontWeight: 600 }}>Aggiungi con una foto</div>
          <div style={{ fontSize: 12.5, opacity: .9, marginTop: 2 }}>L'AI riconosce il piatto e stima grammature e valori</div>
        </div>
        <ChevronRight size={20} />
      </div>
    </button>
  );

  const fastingCard = (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 12.5, color: C.muted, alignSelf: "flex-start", marginBottom: 6 }}>Ultimo pasto</div>
        <Ring frac={fasting.frac} big={fasting.label} small="dall'ultimo pasto" />
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, padding: "7px 15px", borderRadius: 100, background: fasting.tone.bg, color: fasting.tone.fg, display: "flex", alignItems: "center", gap: 7 }}>{fasting.icon} {fasting.status}</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 10, textAlign: "center", maxWidth: 300 }}>{fasting.sub}</div>
        <button onClick={() => { db.meals.logNow(Date.now()); toast.show("Ultimo pasto aggiornato"); }} style={btnGhost}><RefreshCw size={15} /> Ho mangiato ora</button>
      </div>
    </Card>
  );

  const registerCard = (
    <Card>
      <SectionH icon={<Plus size={17} color={C.ink} />}>Registra un pasto</SectionH>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {[["Colazione", Sparkles], ["Pranzo", UtensilsCrossed], ["Cena", Clock], ["Spuntino", Apple]].map(([l, Ic]) => (
          <button key={l} onClick={() => setSheet({ type: "entry", data: { meal: l } })} style={quickBtn}><Ic size={22} color={C.ink} /><span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{l}</span></button>
        ))}
      </div>
    </Card>
  );

  const hubGrid = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
      {[["Sostituzioni", ArrowRightLeft, () => setSheet({ type: "sostituzioni" })], ["Alimenti", Leaf, () => setSheet({ type: "foods" })], ["Ricette", UtensilsCrossed, () => setSheet({ type: "recipes" })], ["Frequenze", TrendingUp, () => setSheet({ type: "freq" })], ["Report visita", FileText, () => setSheet({ type: "report" })], ["Profilo & misure", User, () => setSheet({ type: "profile" })]].map(([t, Ic, on]) => (
        <button key={t} onClick={on} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 15, cursor: "pointer", boxShadow: SH, display: "flex", flexDirection: "column", gap: 8, textAlign: "left", fontFamily: sans }}>
          <Ic size={22} color={C.ink} /><span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{t}</span>
        </button>
      ))}
    </div>
  );

  const suppsCard = (
    <Card>
      <SectionH icon={<PillIcon size={17} color={C.ink} />}>Integrazione di oggi</SectionH>
      {SUPPS.map((s) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.goldBg, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><PillIcon size={16} color="#96702A" /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>{s.n}</div><div style={{ fontSize: 12, color: C.muted }}>{s.dose} · {s.when}</div></div>
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{s.time}</span>
        </div>
      ))}
    </Card>
  );

  if (isDesktop) {
    return (
      <>
        <Eyebrow>Oggi</Eyebrow><H1>La tua giornata</H1>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)", gap: 20, alignItems: "start", marginTop: 4 }}>
          <div>{nutritionCard}{aiBtn}{registerCard}{hubGrid}</div>
          <div>{fastingCard}{suppsCard}</div>
        </div>
        <Disc />
      </>
    );
  }

  return (
    <>
      <Eyebrow>Oggi</Eyebrow><H1>La tua giornata</H1>
      {nutritionCard}
      {aiBtn}
      {fastingCard}
      {registerCard}
      {hubGrid}
      {suppsCard}
      <Disc />
    </>
  );
}

/* ============================================================
   PIANO
   ============================================================ */
function Piano({ day, setDay, setSheet, piano, store }) {
  const d = DAYS[day];
  const profile = store?.profile || {};
  const archNome = profile.archetipo ? (ARCHETIPI[profile.archetipo]?.nome || "Personalizzato") : "Piano";
  let meals;
  if (piano) {
    const g = piano.giorni[day];
    meals = [piano.colazione, piano.spuntino, { slot: "Pranzo", items: g.pranzo }, piano.merenda, { slot: "Cena", items: g.cena }, piano.olio];
  } else {
    meals = [COLAZIONE, SP_AM, { slot: "Pranzo", items: WEEK[d].pranzo }, MERENDA, { slot: "Cena", items: WEEK[d].cena }, EVO];
  }
  const dayTot = piano ? sumPianoItems(meals.flatMap((m) => m.items)) : sumMeal(meals.flatMap((m) => m.items));
  const training = WORKOUT[day].train;
  const nota = piano ? piano.giorni[day].nota : DAYNOTE[d];
  return (
    <>
      <Eyebrow>{archNome}</Eyebrow><H1>Piano della settimana</H1>
      <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 16px" }}>Porzioni calcolate sul tuo profilo. Sotto ogni pasto trovi kcal e macro.</p>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
        {DAYS.map((x, i) => <button key={x} onClick={() => setDay(i)} style={{ flex: "0 0 auto", border: `1px solid ${i === day ? C.ink : C.line}`, background: i === day ? C.ink : C.card, color: i === day ? "#fff" : C.muted, borderRadius: 100, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: sans }}>{x}</button>)}
      </div>

      <div style={{ background: C.ink, color: "#fff", borderRadius: 18, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: SH }}>
        <div><div style={{ fontSize: 11.5, opacity: .85 }}>Totale del giorno</div><div style={{ fontFamily: serif, fontSize: 26, fontWeight: 600 }}>{r0(dayTot.kcal)} kcal</div></div>
        <div style={{ display: "flex", gap: 14, fontSize: 12.5 }}>
          {[["P", dayTot.p, C.prot], ["C", dayTot.c, C.carb], ["G", dayTot.f, C.fat]].map(([l, v, col]) => (
            <div key={l} style={{ textAlign: "center" }}><div style={{ width: 8, height: 8, borderRadius: 100, background: col, margin: "0 auto 4px" }} /><div style={{ fontWeight: 600 }}>{r0(v)}g</div><div style={{ opacity: .7, fontSize: 10 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {training && (
        <div style={{ background: C.goldBg, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#8a6412", display: "flex", gap: 9, marginBottom: 14 }}>
          <Dumbbell size={16} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>Giorno di allenamento.</b> Aumenta i carboidrati a pranzo: 70g pasta / 60g riso / 200g patate.</span>
        </div>
      )}

      {meals.map((m) => {
        const mt = piano ? sumPianoItems(m.items) : sumMeal(m.items);
        return (
          <Card key={m.slot} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: sans, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>{m.slot}</span>
              {mt.kcal > 0 && <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>≈ {r0(mt.kcal)} kcal</span>}
            </div>
            {m.items.map((it, idx) => {
              const canSub = (it.id && ALIMENTI_BY_ID[it.id]) || it.eq;
              return (
                <div key={idx} onClick={() => { if (it.id && ALIMENTI_BY_ID[it.id]) setSheet({ type: "sostituzioni", data: { id: it.id, g: it.g } }); else if (it.eq) setSheet({ type: "swap", data: it }); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: idx < m.items.length - 1 ? `1px solid ${C.line}` : "none", cursor: canSub ? "pointer" : "default" }}>
                  <div style={{ flex: 1 }}><span style={{ fontWeight: 600, fontSize: 14.5, color: C.text }}>{it.n}</span>{it.g > 0 && <span style={{ fontSize: 13, color: C.muted, marginLeft: 6 }}>{it.g} g</span>}</div>
                  {canSub && <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.ink, fontSize: 12, fontWeight: 600 }}><ArrowRightLeft size={14} /> Sostituzioni</span>}
                </div>
              );
            })}
            {mt.kcal > 0 && <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              {[["P", mt.p, C.prot], ["C", mt.c, C.carb], ["G", mt.f, C.fat]].map(([l, v, col]) => <span key={l} style={{ fontSize: 11, fontWeight: 600, color: "#fff", background: col, padding: "3px 9px", borderRadius: 100 }}>{l} {r0(v)}g</span>)}
            </div>}
          </Card>
        );
      })}

      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#3a4a41", display: "flex", gap: 9, marginBottom: 14 }}>
        <Info size={16} color={C.gold} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>{d}.</b> {nota}</span>
      </div>
      <Disc />
    </>
  );
}

/* ============================================================
   SPESA (shopping list from the plan)
   ============================================================ */
function Spesa({ store, db, tf, setTf, piano }) {
  const rows = useMemo(() => {
    const mult = tf === "day" ? 1 / 7 : tf === "month" ? 4.345 : 1;
    const agg = {};
    if (piano) {
      piano.giorni.forEach((g) => {
        [...piano.colazione.items, ...piano.spuntino.items, ...g.pranzo, ...piano.merenda.items, ...g.cena, ...piano.olio.items].forEach((it) => {
          if (!it.g) return; const key = it.n; agg[key] = (agg[key] || 0) + it.g;
        });
      });
    } else {
      DAYS.forEach((d) => [...COLAZIONE.items, ...SP_AM.items, ...WEEK[d].pranzo, ...MERENDA.items, ...WEEK[d].cena, ...EVO.items].forEach((it) => {
        if (!it.g) return; const key = it.n; agg[key] = (agg[key] || 0) + it.g;
      }));
    }
    const cat = (n) => { const k = nutriKey(n); if (["pollo", "merluzzo", "salmone", "gamberi", "tonno", "seppia", "vitello", "bresaola"].includes(k)) return "Carne & pesce"; if (["zucchine", "carote", "spinaci", "verdura"].includes(k)) return "Verdura"; if (["kiwi", "fragole", "frutta"].includes(k)) return "Frutta"; if (["yogurt", "uova", "formaggio"].includes(k)) return "Frigo"; return "Dispensa"; };
    return Object.entries(agg).map(([n, g]) => ({ n, g: g * mult, cat: cat(n) }));
  }, [tf, piano]);
  const byCat = {}; rows.forEach((r) => (byCat[r.cat] = byCat[r.cat] || []).push(r));
  const fmt = (g) => g >= 1000 ? (g / 1000).toFixed(1) + " kg" : Math.round(g) + " g";
  return (
    <>
      <Eyebrow>Collegata al piano</Eyebrow><H1>Lista della spesa</H1>
      <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 14px" }}>Generata dagli alimenti del piano settimanale.</p>
      <div style={{ display: "flex", background: C.greenL, borderRadius: 13, padding: 4, gap: 3, marginBottom: 16 }}>
        {[["day", "Giorno"], ["week", "Settimana"], ["month", "Mese"]].map(([k, l]) => <button key={k} onClick={() => setTf(k)} style={{ flex: 1, border: "none", background: tf === k ? "#fff" : "none", boxShadow: tf === k ? "0 2px 7px -3px rgba(0,0,0,.2)" : "none", borderRadius: 10, padding: "10px 4px", fontFamily: sans, fontWeight: 600, fontSize: 12.5, color: C.ink, cursor: "pointer" }}>{l}</button>)}
      </div>
      {Object.entries(byCat).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11.5, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted, fontWeight: 700, margin: "16px 2px 6px" }}>{cat}</div>
          {items.map((r) => {
            const ck = store.checked.has(r.n);
            return (
              <div key={r.n} onClick={() => db.shopping.toggle(r.n)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, marginBottom: 7, cursor: "pointer" }}>
                <span style={{ width: 22, height: 22, flex: "0 0 auto", border: `2px solid ${ck ? C.ink : C.line}`, borderRadius: 7, background: ck ? C.ink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{ck && <Check size={14} />}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: C.text, textDecoration: ck ? "line-through" : "none", opacity: ck ? .5 : 1 }}>{r.n}</span>
                <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{fmt(r.g)}</span>
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ background: C.goldBg, borderRadius: 12, padding: "11px 13px", fontSize: 12, color: "#8a6412", marginTop: 12, display: "flex", gap: 8 }}>
        <Info size={15} style={{ flex: "0 0 auto", marginTop: 1 }} /><span>Le quantità cambiano tra le sostituzioni scelte: qui è mostrato l'alimento base del piano.</span>
      </div>
      <Disc />
    </>
  );
}

/* ============================================================
   ALLENAMENTO
   ============================================================ */
function Allenamento() {
  const [d, setD] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const w = WORKOUT[d];
  const trainDays = WORKOUT.filter((x) => x.train).length;
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <Eyebrow>Movimento · anti-gonfiore</Eyebrow><H1>Allenamento</H1>
      <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 14px", lineHeight: 1.5 }}>Corpo libero leggero e HIIT di corsa, a basso impatto sull'intestino: {trainDays} sessioni + mobilità. Ogni esercizio ha la sua animazione.</p>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 12 }}>
        {DAYS.map((x, i) => <button key={x} onClick={() => setD(i)} style={{ flex: "0 0 auto", border: `1px solid ${i === d ? C.ink : C.line}`, background: i === d ? C.ink : C.card, color: i === d ? "#fff" : C.muted, borderRadius: 100, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: sans, position: "relative" }}>{x}{WORKOUT[i].train && <span style={{ position: "absolute", top: 5, right: 7, width: 6, height: 6, borderRadius: 100, background: i === d ? C.gold : C.green }} />}</button>)}
      </div>
      <div style={{ borderRadius: 22, padding: 20, marginBottom: 14, color: "#fff", background: w.train ? C.ink : C.green, boxShadow: SHL, position: "relative", overflow: "hidden" }}>
        <BotanicalBg />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11.5, opacity: .85, fontWeight: 600, letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 6 }}>{w.train ? <Dumbbell size={14} /> : <Footprints size={14} />} {w.dur} · {w.focus}</div>
          <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600, marginTop: 6 }}>{w.title}</div>
        </div>
      </div>
      <Card>
        <SectionH icon={<Activity size={17} color={C.ink} />}>Esercizi</SectionH>
        {w.ex.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 13, padding: "11px 0", borderBottom: i < w.ex.length - 1 ? `1px solid ${C.line}` : "none", alignItems: "center" }}>
            <ExDemo kind={e.demo} size={54} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{e.n}</div>
              <div style={{ fontSize: 12.5, color: C.gold, fontWeight: 600, marginTop: 1 }}>{e.meta}</div>
              {e.tip && <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{e.tip}</div>}
            </div>
          </div>
        ))}
      </Card>
      {w.train ? (
        <div style={{ background: C.goldBg, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: "#8a6412", display: "flex", gap: 9, marginBottom: 14 }}>
          <UtensilsCrossed size={16} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>Nutrizione del giorno.</b> Ti alleni: porta i carboidrati del pranzo alla quota "allenamento" del piano. Proteine entro 1–2h dalla sessione.</span>
        </div>
      ) : (
        <div style={{ background: C.greenL, borderRadius: 14, padding: "12px 14px", fontSize: 12.5, color: C.ink, display: "flex", gap: 9, marginBottom: 14 }}>
          <Leaf size={16} style={{ flex: "0 0 auto", marginTop: 1 }} /><span><b>Perché aiuta la pancia.</b> Camminata dopo i pasti, respirazione diaframmatica e torsioni del busto favoriscono il transito e riducono il gonfiore. Niente sforzi intensi a stomaco pieno.</span>
        </div>
      )}
      <Disc />
    </div>
  );
}

/* ============================================================
   DIARIO
   ============================================================ */
function Diario({ store, db, setSheet, toast }) {
  const grouped = useMemo(() => { const g = {}; store.diary.forEach((e) => { const k = new Date(e.ts).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }); (g[k] = g[k] || []).push(e); }); return g; }, [store.diary]);
  return (
    <>
      <Eyebrow>Storico</Eyebrow><H1>Diario</H1>
      <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 14px" }}>Pasti con valori nutrizionali, sintomi e foto.</p>
      <Card>
        <SectionH icon={<Plus size={17} color={C.ink} />}>Registra un pasto</SectionH>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {[["Colazione", Sparkles], ["Pranzo", UtensilsCrossed], ["Cena", Clock], ["Spuntino", Apple]].map(([l, Ic]) => (
            <button key={l} onClick={() => setSheet({ type: "entry", data: { meal: l } })} style={quickBtn}><Ic size={22} color={C.ink} /><span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{l}</span></button>
          ))}
        </div>
        <button onClick={() => setSheet({ type: "ai" })} style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 10 }}><Wand2 size={15} /> Oppure aggiungi con una foto</button>
      </Card>
      {!store.diary.length ? (
        <div style={{ textAlign: "center", padding: "36px 20px", color: C.muted }}>
          <Camera size={40} color="#CBD9CE" style={{ marginBottom: 10 }} />
          <div>Ancora nessun pasto registrato. Usa i pulsanti qui sopra per iniziare.</div>
        </div>
      ) : Object.entries(grouped).map(([date, list]) => (
        <div key={date}>
          <div style={{ fontFamily: serif, fontSize: 15, fontWeight: 600, color: C.ink, margin: "16px 0 8px", textTransform: "capitalize" }}>{date}</div>
          {list.map((e) => (
            <Card key={e.id} style={{ padding: 12, display: "flex", gap: 12 }}>
              {e.photo ? <img src={e.photo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flex: "0 0 auto" }} /> : <div style={{ width: 72, height: 72, borderRadius: 12, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><UtensilsCrossed size={26} color={C.ink} /></div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.gold }}>{e.meal}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{new Date(e.ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <div style={{ fontSize: 13.5, fontWeight: 500, margin: "3px 0 6px", color: C.text }}>{e.food || "—"}</div>
                {e.nutri && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{r0(e.nutri.kcal)} kcal</span>
                  {[["P", e.nutri.p, C.prot], ["C", e.nutri.c, C.carb], ["G", e.nutri.f, C.fat]].map(([l, v, col]) => <span key={l} style={{ fontSize: 10.5, fontWeight: 600, color: "#fff", background: col, padding: "2px 8px", borderRadius: 100 }}>{l} {r0(v)}g</span>)}
                </div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {SYMPTOMS.filter((s) => e[s.k] > 0).map((s) => <Pill key={s.k} tone={s.k === "regolarita" ? "green" : "clay"}>{s.label}: {LEVELS[e[s.k]]}</Pill>)}
                  {e.note && <Pill tone="plain">{e.note}</Pill>}
                </div>
              </div>
              <button onClick={() => db.diary.remove(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, alignSelf: "flex-start" }}><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      ))}
      <Disc />
    </>
  );
}

/* ============================================================
   SHEETS
   ============================================================ */
function Sheet({ sheet, close, ctx }) {
  return (
    <div onClick={(e) => e.target === e.currentTarget && close()} style={{ position: "fixed", inset: 0, background: "rgba(30,50,40,.45)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: C.cream, width: "100%", maxWidth: 440, borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", padding: "8px 18px 28px", animation: "qslideup .3s ease", position: "relative" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 -18px 10px", padding: "8px 18px", background: C.cream }}>
          <div style={{ width: 40, height: 4, borderRadius: 100, background: C.line }} />
          <button onClick={close} aria-label="Chiudi" style={{ position: "absolute", right: 14, top: 4, width: 34, height: 34, borderRadius: 100, border: "none", background: C.card, color: C.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: SH }}><X size={19} /></button>
        </div>
        {sheet.type === "swap" && <SwapSheet item={sheet.data} />}
        {sheet.type === "sostituzioni" && <SostituzioniSheet ctx={ctx} data={sheet.data} />}
        {sheet.type === "entry" && <EntrySheet data={sheet.data} ctx={ctx} close={close} />}
        {sheet.type === "ai" && <AiSheet ctx={ctx} close={close} />}
        {sheet.type === "plans" && <PlansSheet ctx={ctx} close={close} />}
        {sheet.type === "freq" && <FreqSheet ctx={ctx} />}
        {sheet.type === "foods" && <FoodsSheet />}
        {sheet.type === "recipes" && <RecipesSheet />}
        {sheet.type === "report" && <ReportSheet ctx={ctx} />}
        {sheet.type === "profile" && <ProfileSheet ctx={ctx} />}
      </div>
    </div>
  );
}

function SwapSheet({ item }) {
  const eq = EQUIV[item.eq];
  const fmap = { ok: { t: "Basso FODMAP", c: C.ok, bg: C.greenL }, mod: { t: "Moderato", c: "#96702A", bg: C.goldBg }, no: { t: "Alto FODMAP", c: "#A24E37", bg: "#F6E4DC" } };
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink }}>Sostituzioni</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>{eq.label}</div>
      <div style={{ background: C.ink, color: "#fff", borderRadius: 14, padding: "12px 15px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontWeight: 600 }}>{eq.base.n}</span><span style={{ fontFamily: serif, fontSize: 20 }}>{eq.base.g} g</span></div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, margin: "0 0 8px" }}>Equivalenti</div>
      {eq.alts.map((a) => { const f = fmap[a.fodmap]; return (
        <div key={a.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{a.n}</div><span style={{ fontSize: 10.5, fontWeight: 600, color: f.c, background: f.bg, padding: "2px 8px", borderRadius: 100, marginTop: 4, display: "inline-block" }}>{f.t}</span></div>
          <span style={{ fontFamily: serif, fontSize: 17, color: C.ink, fontWeight: 600 }}>{a.g} g</span>
        </div>
      ); })}
    </>
  );
}

function AiSheet({ ctx, close }) {
  const [photo, setPhoto] = useState(null);
  const [b64, setB64] = useState(null);
  const [mime, setMime] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [items, setItems] = useState([]);
  const [meal, setMeal] = useState("Pranzo");
  const fileRef = useRef();

  const onFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setMime(file.type); setPhoto(URL.createObjectURL(file));
    const rd = new FileReader(); rd.onload = () => setB64(rd.result.split(",")[1]); rd.readAsDataURL(file);
    setState("idle"); setResult(null);
  };
  const analyze = async () => {
    if (!b64) return; setState("loading");
    try {
      const r = await ctx.db.analyzePhoto(b64, mime);
      setResult(r);
      setItems((r.alimenti || []).map((a) => ({ ...a, perG: { kcal: a.kcal / (a.grammi || 1), p: a.proteine / (a.grammi || 1), c: a.carboidrati / (a.grammi || 1), f: a.grassi / (a.grammi || 1) } })));
      setState("done");
    } catch (e) { setState("error"); }
  };
  const setGrams = (i, g) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, grammi: g } : it));
  const tot = items.reduce((a, it) => ({ kcal: a.kcal + it.perG.kcal * it.grammi, p: a.p + it.perG.p * it.grammi, c: a.c + it.perG.c * it.grammi, f: a.f + it.perG.f * it.grammi }), { kcal: 0, p: 0, c: 0, f: 0 });
  const save = async () => {
    await ctx.db.diary.add({ ts: Date.now(), meal, food: (result?.piatto || "Pasto") + " — " + items.map((i) => i.nome).join(", "), photo, nutri: tot, gonfiore: 0, dolore: 0, flatulenza: 0, regolarita: 0 });
    ctx.toast.show("Salvato nel diario"); close();
  };

  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Aggiungi con una foto</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>L'AI stima alimenti, grammature e valori. Controlla e correggi prima di salvare.</div>

      {!photo ? (
        <button onClick={() => fileRef.current.click()} style={{ width: "100%", border: `1.5px dashed ${C.line}`, borderRadius: 18, padding: 34, background: "#fff", cursor: "pointer", color: C.muted, fontFamily: sans, fontSize: 14 }}>
          <Camera size={34} color={C.ink} /><div style={{ marginTop: 8, fontWeight: 600, color: C.text }}>Scatta o carica il piatto</div><div style={{ fontSize: 12, marginTop: 2 }}>Inquadra dall'alto, con le posate come riferimento</div>
        </button>
      ) : (
        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
          <img src={photo} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
          <button onClick={() => { setPhoto(null); setB64(null); setResult(null); setItems([]); setState("idle"); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(30,50,40,.7)", color: "#fff", border: "none", borderRadius: 100, width: 30, height: 30, cursor: "pointer" }}><X size={15} /></button>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />

      {photo && state !== "done" && (
        <button onClick={analyze} disabled={state === "loading"} style={{ ...btnPrimary, opacity: state === "loading" ? .7 : 1 }}>
          {state === "loading" ? <><Loader2 size={18} className="qspin" /> Analisi in corso…</> : <><Wand2 size={18} /> Analizza il piatto</>}
        </button>
      )}
      {state === "error" && <div style={{ background: "#F6E4DC", color: "#A24E37", fontSize: 12.5, padding: "11px 13px", borderRadius: 11, marginTop: 12, display: "flex", gap: 8 }}><Info size={15} style={{ flex: "0 0 auto", marginTop: 1 }} /><span>Non sono riuscita ad analizzare la foto. Riprova con un'immagine più chiara, oppure inserisci il pasto a mano.</span></div>}

      {state === "done" && (
        <>
          <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 600, color: C.ink, margin: "16px 0 4px" }}>{result?.piatto || "Piatto"}</div>
          <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 12 }}>Tocca le grammature per correggerle.</div>
          {items.length === 0 && <div style={{ fontSize: 13, color: C.muted, padding: "10px 0" }}>Non ho riconosciuto cibo nella foto.</div>}
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{it.nome}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{r0(it.perG.kcal * it.grammi)} kcal · P{r0(it.perG.p * it.grammi)} C{r0(it.perG.c * it.grammi)} G{r0(it.perG.f * it.grammi)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 100, padding: "4px 6px" }}>
                <button onClick={() => setGrams(i, Math.max(0, it.grammi - 10))} style={stepBtn}>–</button>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 44, textAlign: "center" }}>{r0(it.grammi)} g</span>
                <button onClick={() => setGrams(i, it.grammi + 10)} style={stepBtn}>+</button>
              </div>
            </div>
          ))}
          <div style={{ background: C.ink, color: "#fff", borderRadius: 16, padding: "14px 16px", margin: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 11.5, opacity: .85 }}>Totale stimato</div><div style={{ fontFamily: serif, fontSize: 24, fontWeight: 600 }}>{r0(tot.kcal)} kcal</div></div>
            <div style={{ display: "flex", gap: 12, fontSize: 12 }}>{[["P", tot.p], ["C", tot.c], ["G", tot.f]].map(([l, v]) => <div key={l} style={{ textAlign: "center" }}><div style={{ fontWeight: 600 }}>{r0(v)}g</div><div style={{ opacity: .7, fontSize: 10 }}>{l}</div></div>)}</div>
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 12, overflowX: "auto" }}>
            {["Colazione", "Pranzo", "Cena", "Spuntino"].map((m) => <button key={m} onClick={() => setMeal(m)} style={{ flex: "0 0 auto", border: `1px solid ${meal === m ? C.ink : C.line}`, background: meal === m ? C.ink : "#fff", color: meal === m ? "#fff" : C.muted, borderRadius: 100, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: sans }}>{m}</button>)}
          </div>
          <button onClick={save} style={btnPrimary}><Check size={18} /> Salva nel diario</button>
          <div style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Le stime AI hanno un margine d'errore (~15%): correggi le grammature per più precisione.</div>
        </>
      )}
    </>
  );
}

function SostituzioniSheet({ ctx, data }) {
  const cond = ctx.store.profile.condizioni || [];
  const restr = { fodmapBasso: cond.includes("ibs"), senzaGlutine: cond.includes("celiachia"), senzaLattosio: cond.includes("intolleranza_lattosio") };
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(data?.id || null);
  const [g, setG] = useState(String(data?.g || (data?.id && ALIMENTI_BY_ID[data.id]?.porzioneG) || ""));
  const mese = new Date().getMonth() + 1;
  const base = sel ? ALIMENTI_BY_ID[sel] : null;
  const grBase = +g || (base ? base.porzioneG : 0);
  const results = q.trim().length >= 2 ? ALIMENTI.filter((a) => a.nome.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 12) : [];
  const subs = base ? sostituti(sel, grBase, { ...restr, limite: 10 }) : [];
  const nb = base ? nutriPerGrammi(base.id, grBase) : null;
  const RL = { carbo: "carboidrati", proteine: "proteine", grassi: "grassi", verdura: "calorie", frutta: "calorie" };
  const chips = (n) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: base ? "#fff" : C.ink }}>{r0(n.kcal)} kcal</span>
      {[["P", n.proteine, C.prot], ["C", n.carboidrati, C.carb], ["G", n.grassi, C.fat]].map(([l, v, col]) => <span key={l} style={{ fontSize: 10.5, fontWeight: 600, color: "#fff", background: col, padding: "2px 8px", borderRadius: 100 }}>{l} {r0(v)}g</span>)}
    </div>
  );
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Sostituzioni</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Scambia un cibo con un altro dello stesso tipo, con la grammatura giusta per pareggiare i macro.</div>
      {!base ? (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un alimento (pasta, pollo, mela…)" style={{ ...input, marginBottom: 12 }} />
          {results.map((a) => (
            <div key={a.id} onClick={() => { setSel(a.id); setG(String(a.porzioneG)); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{catIcon(a.categoria)}</div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.nome}</div><div style={{ fontSize: 11.5, color: C.muted }}>{a.kcal} kcal/100g · {fodmapLabel(a.fodmap)}</div></div>
              <ChevronRight size={17} color={C.muted} />
            </div>
          ))}
          {!results.length && ["verdura", "frutta"].map((cat) => {
            const items = diStagione(mese, cat);
            if (!items.length) return null;
            return (
              <div key={cat} style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.gold, margin: "10px 0 8px", display: "flex", alignItems: "center", gap: 6 }}><Leaf size={13} /> {cat === "verdura" ? "Verdura" : "Frutta"} di stagione</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {items.map((a) => <button key={a.id} onClick={() => { setSel(a.id); setG(String(a.porzioneG)); }} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 100, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: sans }}>{a.nome}</button>)}
                </div>
              </div>
            );
          })}
          {!results.length && <p style={{ fontSize: 11.5, color: C.muted, marginTop: 14, lineHeight: 1.5 }}>Stagionalità italiana del mese corrente. Cerca un alimento sopra per vedere le sostituzioni con le grammature giuste.</p>}
        </>
      ) : (
        <>
          <button onClick={() => { setSel(null); setG(""); }} style={{ ...btnGhost, marginTop: 0 }}><ChevronLeft size={15} /> Cambia alimento</button>
          <div style={{ background: C.ink, color: "#fff", borderRadius: 16, padding: "14px 16px", margin: "10px 0 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>{base.nome}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input value={g} onChange={(e) => setG(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={String(base.porzioneG)} style={{ width: 60, background: "rgba(255,255,255,.16)", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600, padding: "6px 8px", textAlign: "right", fontFamily: sans }} />
                <span style={{ fontSize: 13, opacity: .85 }}>g</span>
              </div>
            </div>
            {nb && chips(nb)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>Equivalenti</div>
          <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 8 }}>Grammatura per pareggiare {RL[ruoloAlimento(base)]}.</div>
          {subs.map((s) => (
            <div key={s.alimento.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{catIcon(s.alimento.categoria)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.alimento.nome}</span><span style={{ fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.ink }}>{s.grammi} g</span></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{r0(s.nutri.kcal)} kcal</span>
                  {[["P", s.nutri.proteine, C.prot], ["C", s.nutri.carboidrati, C.carb], ["G", s.nutri.grassi, C.fat]].map(([l, v, col]) => <span key={l} style={{ fontSize: 10.5, fontWeight: 600, color: "#fff", background: col, padding: "2px 8px", borderRadius: 100 }}>{l} {r0(v)}g</span>)}
                </div>
              </div>
            </div>
          ))}
          {!subs.length && <div style={{ fontSize: 13, color: C.muted, padding: "16px 0" }}>Nessuna sostituzione compatibile con i tuoi filtri (IBS/glutine/lattosio).</div>}
        </>
      )}
    </>
  );
}

function EntrySheet({ data, ctx, close }) {
  const [food, setFood] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [sym, setSym] = useState({ gonfiore: 0, dolore: 0, flatulenza: 0, regolarita: 0 });
  const fileRef = useRef();
  const onFile = (e) => { const f = e.target.files[0]; if (f) setPhoto(URL.createObjectURL(f)); };
  const nutri = useMemo(() => food ? nutriFor(food, 100) : null, [food]);
  const save = async () => {
    if (!food && !photo) { ctx.toast.show("Aggiungi cibo o foto"); return; }
    await ctx.db.diary.add({ ts: Date.now(), meal: data.meal, food, note, photo, nutri: food ? nutriFor(food, 150) : null, ...sym });
    ctx.toast.show("Salvato nel diario"); close();
  };
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Registra: {data.meal}</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>Preferisci la foto? <b onClick={() => { close(); ctx.setSheet({ type: "ai" }); }} style={{ color: C.ink, cursor: "pointer" }}>Usa l'AI →</b></div>
      <Field label="Cosa hai mangiato"><textarea value={food} onChange={(e) => setFood(e.target.value)} rows={2} placeholder="Es. Riso con zucchine e pollo" style={input} /></Field>
      <Field label="Foto del pasto">
        {photo ? <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}><img src={photo} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} /><button onClick={() => setPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(30,50,40,.7)", color: "#fff", border: "none", borderRadius: 100, width: 30, height: 30, cursor: "pointer" }}><X size={15} /></button></div>
          : <button onClick={() => fileRef.current.click()} style={{ width: "100%", border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: 18, background: "#fff", cursor: "pointer", color: C.muted, fontFamily: sans, fontSize: 13.5 }}><Camera size={26} color={C.ink} /><div style={{ marginTop: 6 }}>Scatta o carica una foto</div></button>}
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </Field>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: C.text }}>Sintomi dopo il pasto</div>
      {SYMPTOMS.map((s) => (
        <div key={s.k} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, color: C.text }}>{s.label}</span><span style={{ fontSize: 12, fontWeight: 600, color: sym[s.k] >= 2 ? C.clay : C.muted }}>{s.k === "regolarita" ? ["—", "Scarsa", "Buona", "Ottima"][sym[s.k]] : LEVELS[sym[s.k]]}</span></div>
          <div style={{ display: "flex", gap: 5 }}>{[0, 1, 2, 3].map((v) => <button key={v} onClick={() => setSym({ ...sym, [s.k]: v })} style={{ flex: 1, height: 30, borderRadius: 8, border: "none", cursor: "pointer", background: v <= sym[s.k] && sym[s.k] > 0 ? (s.k === "regolarita" ? C.green : C.clay) : "#EBE5D8" }} />)}</div>
        </div>
      ))}
      <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Energia, umore, altro…" style={input} /></Field>
      <button onClick={save} style={btnPrimary}><Check size={18} /> Salva nel diario</button>
    </>
  );
}

function PlansSheet({ ctx, close }) {
  const prof = ctx.store.profile;
  // Dopo l'assessment: lo switch cambia l'ARCHETIPO (che guida davvero i macro),
  // non i vecchi piani demo. Le kcal restano sul fabbisogno, cambiano carbo/grassi.
  if (prof.assessmentDone && prof.archetipo) {
    return (
      <>
        <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Il tuo approccio</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Cambia lo stile alimentare: le kcal restano sul tuo fabbisogno, si adattano i macro.</div>
        {Object.values(ARCHETIPI).map((a) => { const active = a.id === prof.archetipo; return (
          <div key={a.id} onClick={() => { ctx.changeArchetipo(a.id); ctx.toast.show(`Approccio: ${a.nome}`); close(); }} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: C.card, border: `1.5px solid ${active ? C.ink : C.line}`, borderRadius: 16, padding: 14, marginBottom: 11, cursor: "pointer" }}>
            <div style={{ width: 12, height: 12, borderRadius: 100, background: a.colore, marginTop: 4, flex: "0 0 auto" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{a.nome}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>{a.descrizione}</div>
              <div style={{ fontSize: 11.5, color: C.gold, marginTop: 4 }}>Carbo {a.macroPct.carboidrati}% · Prot {a.macroPct.proteine}% · Grassi {a.macroPct.grassi}%</div>
            </div>
            {active ? <Check size={20} color={C.ink} /> : <ChevronRight size={18} color={C.muted} />}
          </div>
        ); })}
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>Import dei piani PDF delle nutrizioniste in arrivo.</div>
      </>
    );
  }
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>I miei piani</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Tutti i piani delle tue nutrizioniste. Tocca per attivare.</div>
      {PLANS.map((p) => { const active = p.id === ctx.store.activePlan; return (
        <div key={p.id} onClick={() => { ctx.db.plans.setActive(p.id); ctx.toast.show(`Attivo: ${p.name}`); close(); }} style={{ display: "flex", gap: 13, alignItems: "center", background: C.card, border: `1.5px solid ${active ? C.ink : C.line}`, borderRadius: 16, padding: 14, marginBottom: 11, cursor: "pointer" }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}><FileText size={22} color="#fff" /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{p.name}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{p.who} · {p.kcal} kcal · {p.start}</div><div style={{ fontSize: 11.5, color: C.gold, marginTop: 3 }}>{p.goal}</div></div>
          {active ? <Check size={20} color={C.ink} /> : <ChevronRight size={18} color={C.muted} />}
        </div>
      ); })}
      <button onClick={close} style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 4 }}><Plus size={16} /> Importa un piano da PDF</button>
    </>
  );
}

function FreqSheet({ ctx }) {
  const counts = useMemo(() => {
    const now = Date.now(), wk = 7 * 864e5, c = {}; FREQ.forEach((f) => (c[f.g] = 0));
    ctx.store.diary.filter((e) => now - e.ts < wk).forEach((e) => { const t = (e.food || "").toLowerCase();
      if (/pesce|merluzz|salmon|tonn|orata|gamber|seppia|spada|nasello|sgombro/.test(t)) c["Pesce"]++;
      if (/pollo|tacchino/.test(t)) c["Carne bianca"]++;
      if (/lentic|ceci|fagiol|legum|pisell/.test(t)) c["Legumi"]++;
      if (/uov|omelette|frittat/.test(t)) c["Uova"]++;
      if (/yogurt|parmigian|feta|formagg|latte/.test(t)) c["Latticini"]++;
      if (/manzo|vitello|carpaccio|bresaola|maiale/.test(t)) c["Carne rossa"]++;
    }); return c;
  }, [ctx.store.diary]);
  const IconFor = { fish: Fish, activity: Activity, leaf: Leaf, apple: Apple, milk: Milk };
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Frequenze settimanali</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Contate dal diario di questa settimana rispetto ai limiti del piano.</div>
      {FREQ.map((f) => { const n = counts[f.g] || 0, over = n > f.max, Ic = IconFor[f.icon] || Leaf; return (
        <div key={f.g} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Ic size={16} color={C.ink} /><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{f.g}</span><span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 600, color: over ? C.clay : C.muted }}>{n} / {f.max} a settimana</span></div>
          <div style={{ height: 8, background: "#EBE5D8", borderRadius: 100, overflow: "hidden" }}><div style={{ width: `${Math.min(100, (n / f.max) * 100)}%`, height: "100%", background: over ? C.clay : C.green, transition: ".3s" }} /></div>
        </div>
      ); })}
    </>
  );
}

function FoodsSheet() {
  const [mode, setMode] = useState("yes");
  const cats = FODMAP[mode];
  const IconFor = { wheat: Wheat, apple: Apple, leaf: Leaf, fish: Fish, droplet: Droplet, ban: Ban, milk: Milk, utensils: UtensilsCrossed };
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Alimenti · Low FODMAP</div>
      <div style={{ display: "flex", background: C.greenL, borderRadius: 13, padding: 4, gap: 3, marginBottom: 16 }}>
        {[["yes", "Via libera"], ["no", "Da evitare"], ["snacks", "Spuntini"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} style={{ flex: 1, border: "none", background: mode === k ? "#fff" : "none", boxShadow: mode === k ? "0 2px 7px -3px rgba(0,0,0,.2)" : "none", borderRadius: 10, padding: "9px 3px", fontFamily: sans, fontWeight: 600, fontSize: 12, color: C.ink, cursor: "pointer" }}>{l}</button>)}
      </div>
      {cats.map((cat) => { const Ic = IconFor[cat.i] || Leaf; const tone = mode === "no" ? { bg: "#F6E4DC", bd: "#EDD3C8", fg: "#A24E37" } : mode === "snacks" ? { bg: C.goldBg, bd: "#EBDCB8", fg: "#8a6412" } : { bg: C.greenL, bd: "#D6E7D8", fg: "#2C6E4E" }; return (
        <div key={cat.c} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: ".04em", textTransform: "uppercase", color: C.muted, fontWeight: 700, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 7 }}><Ic size={15} color={C.ink} /> {cat.c}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{cat.items.map((it) => <span key={it} style={{ background: tone.bg, border: `1px solid ${tone.bd}`, color: tone.fg, borderRadius: 100, padding: "7px 12px", fontSize: 12, fontWeight: 500 }}>{it}</span>)}</div>
        </div>
      ); })}
    </>
  );
}

function RecipesSheet() {
  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Ricette</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {RECIPES.map((r) => (
          <div key={r.n} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", boxShadow: SH }}>
            <div style={{ position: "relative" }}><Ill type={r.ill} h={90} /><span style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,.92)", borderRadius: 100, fontSize: 9, fontWeight: 700, color: C.ink, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3 }}><Check size={11} /> FODMAP</span></div>
            <div style={{ padding: "11px 12px" }}><div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25, color: C.text }}>{r.n}</div><div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>{r.t}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function ReportSheet({ ctx }) {
  const { store } = ctx;
  const [period, setPeriod] = useState(30);
  const stats = useMemo(() => {
    const from = Date.now() - period * 864e5;
    const es = store.diary.filter((e) => e.ts >= from);
    const nDays = new Set(es.map((e) => new Date(e.ts).toDateString())).size || 1;
    const wn = es.filter((e) => e.nutri);
    const kc = wn.reduce((a, e) => a + (e.nutri.kcal || 0), 0);
    const mac = wn.reduce((a, e) => ({ p: a.p + e.nutri.p, c: a.c + e.nutri.c, f: a.f + e.nutri.f }), { p: 0, c: 0, f: 0 });
    const symAvg = {};
    SYMPTOMS.forEach((s) => { const vals = es.map((e) => e[s.k] || 0); symAvg[s.k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0; });
    // symptom-food correlation
    const bad = es.filter((e) => (e.gonfiore >= 2 || e.dolore >= 2 || e.flatulenza >= 2));
    const tally = {};
    bad.forEach((e) => { const k = nutriKey(e.food); if (k) tally[k] = (tally[k] || 0) + 1; });
    const triggers = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3);
    // weight delta
    const ms = store.measures.filter((m) => m.ts >= from);
    const dw = ms.length >= 2 ? (ms[ms.length - 1].weight - ms[0].weight) : null;
    return { es, nDays, avgKcal: kc / nDays, avgP: mac.p / nDays, avgC: mac.c / nDays, avgF: mac.f / nDays, symAvg, triggers, dw, meals: es.length };
  }, [store.diary, store.measures, period]);

  const LABEL = { gonfiore: "Gonfiore", dolore: "Dolore add.", flatulenza: "Flatulenza", regolarita: "Regolarità" };
  const KNAME = { pasta: "pasta", riso: "riso", paneGF: "pane/gallette", legumi: "legumi", formaggio: "formaggi", frutta: "frutta", verdura: "verdura", fruttaSecca: "frutta secca", cioccolato: "cioccolato" };

  const download = () => {
    const p = ctx.plan;
    const rows = stats.es.map((e) => `<tr><td>${new Date(e.ts).toLocaleDateString("it-IT")}</td><td>${e.meal}</td><td>${e.food || ""}</td><td>${e.nutri ? r0(e.nutri.kcal) + " kcal" : ""}</td><td>${SYMPTOMS.filter((s) => e[s.k] > 0).map((s) => LABEL[s.k] + " " + LEVELS[e[s.k]]).join(", ")}</td></tr>`).join("");
    const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Report Quiete</title>
<style>body{font-family:Georgia,serif;color:#28352E;max-width:760px;margin:30px auto;padding:0 24px}
h1{color:#1E4B3A} h2{color:#1E4B3A;border-bottom:2px solid #E9E1D3;padding-bottom:6px;margin-top:28px;font-size:17px}
.k{display:inline-block;background:#E7EFE6;color:#1E4B3A;border-radius:20px;padding:4px 12px;font-family:Arial;font-size:13px;margin:3px 4px 3px 0}
table{width:100%;border-collapse:collapse;font-family:Arial;font-size:12px;margin-top:8px}
td,th{border-bottom:1px solid #E9E1D3;padding:7px 8px;text-align:left} th{color:#7C8A80}
.muted{color:#7C8A80;font-family:Arial;font-size:12px}</style></head><body>
<h1>Quiete — Report per la nutrizionista</h1>
<p class="muted">Paziente: ${store.profile.name} · Piano attivo: ${p.name} (${p.who}) · Periodo: ultimi ${period} giorni · Generato il ${new Date().toLocaleDateString("it-IT")}</p>
<h2>Nutrizione media (kcal/die)</h2>
<span class="k">Kcal ${r0(stats.avgKcal)} / ${p.kcal} obiettivo</span><span class="k">Proteine ${r0(stats.avgP)} g</span><span class="k">Carboidrati ${r0(stats.avgC)} g</span><span class="k">Grassi ${r0(stats.avgF)} g</span>
<p class="muted">${stats.nDays} giorni tracciati, ${stats.meals} pasti registrati.</p>
<h2>Sintomi (media 0–3)</h2>
${SYMPTOMS.map((s) => `<span class="k">${LABEL[s.k]}: ${stats.symAvg[s.k].toFixed(1)}</span>`).join("")}
<h2>Possibili trigger (pasti con sintomi ≥ moderato)</h2>
${stats.triggers.length ? stats.triggers.map(([k, n]) => `<span class="k">${KNAME[k] || k} ×${n}</span>`).join("") : '<p class="muted">Nessuna correlazione evidente nel periodo.</p>'}
<h2>Peso</h2>
<p class="muted">${stats.dw != null ? "Variazione nel periodo: " + (stats.dw > 0 ? "+" : "") + r1(stats.dw) + " kg" : "Dati insufficienti."}</p>
<h2>Diario dei pasti</h2>
<table><tr><th>Data</th><th>Pasto</th><th>Alimenti</th><th>Kcal</th><th>Sintomi</th></tr>${rows || '<tr><td colspan="5" class="muted">Nessun pasto nel periodo.</td></tr>'}</table>
<p class="muted" style="margin-top:24px">Documento generato da Quiete a supporto della visita. I valori nutrizionali sono stime.</p>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = "report-quiete.html"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
    ctx.toast.show("Report scaricato");
  };

  return (
    <>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Report per la nutrizionista</div>
      <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>Un riepilogo pulito da portare alla visita: nutrizione, sintomi, trigger e misure.</div>
      <div style={{ display: "flex", background: C.greenL, borderRadius: 13, padding: 4, gap: 3, marginBottom: 16 }}>
        {[[7, "7 giorni"], [30, "30 giorni"]].map(([k, l]) => <button key={k} onClick={() => setPeriod(k)} style={{ flex: 1, border: "none", background: period === k ? "#fff" : "none", boxShadow: period === k ? "0 2px 7px -3px rgba(0,0,0,.2)" : "none", borderRadius: 10, padding: "9px 4px", fontFamily: sans, fontWeight: 600, fontSize: 12.5, color: C.ink, cursor: "pointer" }}>{l}</button>)}
      </div>

      <div style={{ background: C.ink, color: "#fff", borderRadius: 16, padding: "15px 18px", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, opacity: .85 }}>Media giornaliera · {stats.nDays} giorni tracciati</div>
        <div style={{ fontFamily: serif, fontSize: 28, fontWeight: 600, margin: "2px 0 8px" }}>{r0(stats.avgKcal)} kcal</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12.5 }}>
          {[["P", stats.avgP, C.prot], ["C", stats.avgC, C.carb], ["G", stats.avgF, C.fat]].map(([l, v, col]) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 100, background: col }} /><b>{r0(v)}g</b> {l}</div>)}
        </div>
      </div>

      <Card style={{ padding: 16 }}>
        <SectionH icon={<Zap size={17} color={C.ink} />}>Sintomi (media 0–3)</SectionH>
        {SYMPTOMS.map((s) => { const v = stats.symAvg[s.k]; const bad = s.k !== "regolarita" && v >= 1.5; return (
          <div key={s.k} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: C.text }}>{LABEL[s.k]}</span><span style={{ fontWeight: 600, color: bad ? C.clay : C.muted }}>{v.toFixed(1)}</span></div>
            <div style={{ height: 7, background: "#EBE5D8", borderRadius: 100, overflow: "hidden" }}><div style={{ width: `${(v / 3) * 100}%`, height: "100%", background: s.k === "regolarita" ? C.green : (bad ? C.clay : C.gold) }} /></div>
          </div>
        ); })}
      </Card>

      <Card style={{ padding: 16 }}>
        <SectionH icon={<Sparkles size={17} color={C.ink} />}>Possibili trigger</SectionH>
        {stats.triggers.length ? (
          <>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 10 }}>Alimenti più frequenti nei pasti con sintomi da moderati in su:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{stats.triggers.map(([k, n]) => <span key={k} style={{ background: "#F6E4DC", color: "#A24E37", borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 600 }}>{KNAME[k] || k} · {n}×</span>)}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 10 }}>È un segnale, non una diagnosi: valida in fase di reintroduzione con la nutrizionista.</div>
          </>
        ) : <div style={{ fontSize: 13, color: C.muted }}>Nessuna correlazione evidente. Continua a registrare i pasti con i sintomi.</div>}
      </Card>

      <button onClick={download} style={btnPrimary}><Download size={18} /> Scarica il report</button>
      <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Il file si apre nel browser e si può stampare in PDF da portare alla visita.</div>
    </>
  );
}

function ProfileSheet({ ctx }) {
  const { store, db } = ctx;
  const last = store.measures[store.measures.length - 1] || {};
  const bmi = store.profile.height && last.weight ? last.weight / Math.pow(store.profile.height / 100, 2) : null;
  const bmiCat = bmi ? (bmi < 18.5 ? ["Sottopeso", "#3B82C4"] : bmi < 25 ? ["Normopeso", C.ok] : bmi < 30 ? ["Sovrappeso", C.gold] : ["Obesità", C.clay]) : null;
  const chartData = store.measures.map((m) => ({ d: new Date(m.ts).toLocaleDateString("it-IT", { day: "numeric", month: "short" }), peso: m.weight, fm: m.fm }));
  const [f, setF] = useState({ weight: "", waist: "", hips: "", abdomen: "", fm: "" });
  const add = async () => { const m = { ts: Date.now() }; Object.keys(f).forEach((k) => f[k] && (m[k] = parseFloat(f[k]))); if (Object.keys(m).length < 2) { ctx.toast.show("Inserisci un valore"); return; } await db.measurements.add(m); ctx.toast.show("Misurazione salvata"); setF({ weight: "", waist: "", hips: "", abdomen: "", fm: "" }); };
  return (
    <>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, background: C.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 24, fontWeight: 600 }}>{store.profile.name[0]}</div>
        <div><div style={{ fontFamily: serif, fontSize: 20, fontWeight: 600, color: C.ink }}>{store.profile.name}</div><div style={{ fontSize: 12.5, color: C.muted }}>{store.profile.sex} · {store.profile.height} cm {bmiCat && <> · <span style={{ color: bmiCat[1], fontWeight: 600 }}>BMI {bmi.toFixed(1)} · {bmiCat[0]}</span></>}</div></div>
      </div>
      <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted, margin: "4px 0 10px" }}>Antropometria & composizione</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["Peso", last.weight, "kg"], ["Vita", last.waist, "cm"], ["Fianchi", last.hips, "cm"], ["Addome", last.abdomen, "cm"], ["Massa grassa", last.fm, "%"], ["Rilevazioni", store.measures.length, ""]].map(([k, v, u]) => (
          <div key={k} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 13, padding: "10px 11px" }}><div style={{ fontSize: 10.5, color: C.muted }}>{k}</div><div style={{ fontFamily: serif, fontSize: 18, fontWeight: 600, color: C.ink }}>{v ?? "—"}<span style={{ fontSize: 11, color: C.muted, fontFamily: sans }}> {u}</span></div></div>
        ))}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "12px 8px 6px", marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: C.muted, padding: "0 8px 6px", fontWeight: 600 }}>Andamento peso e massa grassa</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.ink} stopOpacity=".25" /><stop offset="1" stopColor={C.ink} stopOpacity="0" /></linearGradient></defs>
            <XAxis dataKey="d" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={30} domain={["dataMin-1", "dataMax+1"]} />
            <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12, fontFamily: sans }} />
            <Area type="monotone" dataKey="peso" stroke={C.ink} strokeWidth={2.5} fill="url(#gp)" />
            <Area type="monotone" dataKey="fm" stroke={C.gold} strokeWidth={2} fill="none" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted, margin: "4px 0 10px" }}>Nuova misurazione</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {[["weight", "Peso kg"], ["waist", "Vita cm"], ["hips", "Fianchi cm"], ["abdomen", "Addome cm"], ["fm", "Massa grassa %"]].map(([k, ph]) => <input key={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} inputMode="decimal" style={{ ...input, flex: "1 1 46%", padding: 11 }} />)}
      </div>
      <button onClick={add} style={btnPrimary}><Plus size={17} /> Salva misurazione</button>

      {/* Account section */}
      <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted, margin: "18px 0 10px" }}>Account</div>
      {ctx.authUser ? (
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 100, background: C.ok }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Sincronizzato</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 12 }}>{ctx.authUser.email}</div>
          <button onClick={ctx.handleLogout} style={{ ...btnGhost, marginTop: 0, width: "100%", justifyContent: "center", color: C.clay, borderColor: "#EDD3C8" }}><LogOut size={15} /> Esci dall'account</button>
        </div>
      ) : (
        <div style={{ background: C.goldBg, borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 13, color: "#8a6412", lineHeight: 1.5 }}>I dati sono salvati solo su questo dispositivo. Crea un account per sincronizzare.</div>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: C.muted, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>I dati clinici vanno interpretati con la tua nutrizionista.</div>
    </>
  );
}

/* ============================================================
   ATOMS
   ============================================================ */
function Frame({ children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{width:0;height:0;}
        @keyframes qslideup{from{transform:translateY(100%)}to{transform:none}}
        @keyframes qspin{to{transform:rotate(360deg)}}
        .qspin{animation:qspin 1s linear infinite;}
        textarea:focus,input:focus{outline:2px solid ${C.ink};border-color:${C.ink};}
        @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      `}</style>
      <div style={{ fontFamily: sans, background: "#EDE7DB", minHeight: "100dvh", color: C.text }}>
        <div style={{ maxWidth: 440, margin: "0 auto", background: C.cream, minHeight: "100dvh", position: "relative" }}>{children}</div>
      </div>
    </>
  );
}

/* ============================================================
   DESKTOP — shell dashboard (sidebar + contenuto multi-colonna).
   Attiva da >= 1024px; sotto resta la UI mobile (Frame).
   ============================================================ */
function useIsDesktop(bp = 1024) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width:${bp}px)`);
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [bp]);
  return desktop;
}

function DesktopShell({ tab, go, plan, store, db, setSheet, sheet, day, setDay, tf, setTf, toast, piano, authUser, handleLogout, changeArchetipo }) {
  const NAV = [
    ["oggi", Home, "Oggi"],
    ["piano", CalendarDays, "Piano"],
    ["spesa", ShoppingCart, "Spesa"],
    ["allenamento", Dumbbell, "Allenamento"],
    ["diario", Camera, "Diario"],
  ];
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes qslideup{from{transform:translateY(100%)}to{transform:none}}
        @keyframes qspin{to{transform:rotate(360deg)}}
        .qspin{animation:qspin 1s linear infinite;}
        textarea:focus,input:focus{outline:2px solid ${C.ink};border-color:${C.ink};}
      `}</style>
      <div className="qk-desktop">
        <aside className="qk-sidebar">
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 18px" }}>
            <Seed size={34} />
            <span style={{ fontFamily: serif, fontWeight: 600, fontSize: 23, color: C.ink }}>Quiete</span>
          </div>
          <button
            onClick={() => setSheet({ type: "plans" })}
            style={{ display: "flex", alignItems: "center", gap: 9, background: C.cream, border: `1px solid ${C.line}`, borderRadius: 13, padding: "10px 12px", cursor: "pointer", fontFamily: sans, marginBottom: 12, textAlign: "left" }}
          >
            <span style={{ width: 10, height: 10, borderRadius: 100, background: plan.color, flex: "0 0 auto" }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{plan.name}</span>
            <ChevronRight size={15} color={C.muted} />
          </button>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map(([k, Ic, l]) => (
              <button key={k} className={"qk-navitem" + (tab === k ? " active" : "")} onClick={() => go(k)}>
                <Ic size={19} /> {l}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSheet({ type: "profile" })} className="qk-navitem" style={{ gap: 11 }}>
            <span style={{ width: 30, height: 30, borderRadius: 100, background: C.ink, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontWeight: 600, fontSize: 14, flex: "0 0 auto" }}>
              {store.profile.name[0]}
            </span>
            {store.profile.name}
          </button>
        </aside>

        <div className="qk-content">
          <div className="qk-content-inner">
            <div className="qdash">
              {tab === "oggi" && <Oggi {...{ plan, store, db, setSheet, go, toast, day, piano, isDesktop: true }} />}
              {tab === "piano" && <Piano {...{ day, setDay, setSheet, piano, store }} />}
              {tab === "spesa" && <Spesa {...{ store, db, tf, setTf, piano }} />}
              {tab === "allenamento" && <Allenamento />}
              {tab === "diario" && <Diario {...{ store, db, setSheet, toast }} />}
            </div>
          </div>
        </div>
      </div>
      {sheet && <Sheet sheet={sheet} close={() => setSheet(null)} ctx={{ plan, store, db, toast, setSheet, authUser, handleLogout, changeArchetipo }} />}
      {toast.node}
    </>
  );
}
const Seed = ({ size = 32 }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.3, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
    <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} fill="none">
      <path d="M16 3C10 8 8 14 12 21c2.6 4.6 4 6 4 8 0-2 1.4-3.4 4-8 4-7 2-13-4-18Z" fill="#fff" />
      <path d="M16 11c-2 2.6-2.6 5.6-1 9" stroke={C.ink} strokeWidth="1.7" strokeLinecap="round" /><circle cx="19" cy="9" r="2" fill={C.gold} />
    </svg>
  </div>
);
const BotanicalBg = () => (
  <svg viewBox="0 0 200 130" style={{ position: "absolute", right: -10, bottom: -14, width: 170, opacity: .16 }}>
    <path d="M120 120c0-30 8-52 34-70M120 120c-6-22-2-40 12-58M120 120c8-18 22-30 44-34" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <circle cx="154" cy="50" r="9" fill="none" stroke="#fff" strokeWidth="2.4" /><circle cx="164" cy="86" r="7" fill="none" stroke="#fff" strokeWidth="2.4" />
  </svg>
);
const Ill = ({ type = "bowl", h = 120 }) => {
  const bg = { porridge: "#F0E9D6", bowl: "#E7EFE6", fish: "#E4EDEE", eggs: "#EDE6D4" }[type] || C.greenL;
  return (<svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: h, display: "block" }}>
    <rect width="200" height="130" fill={bg} /><ellipse cx="100" cy="98" rx="66" ry="17" fill="#fff" opacity=".6" />
    <ellipse cx="100" cy="82" rx="46" ry="20" fill={type === "fish" ? "#DCE7DE" : "#EBDFBE"} />
    <circle cx="84" cy="80" r="7" fill={C.green} /><circle cx="104" cy="76" r="6" fill={C.gold} /><circle cx="116" cy="82" r="5" fill={C.clay} />
  </svg>);
};
// Demo animato di un esercizio (SVG in loop, effetto "gif" — nessun asset esterno).
const ExDemo = ({ kind = "hold", size = 54 }) => {
  const ink = C.ink;
  const L = (x1, y1, x2, y2, extra) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={3} strokeLinecap="round" {...extra} />;
  const anim = (name, dur, origin, delay) => ({ "data-anim": true, style: { animation: `${name} ${dur} infinite ease-in-out`, animationDelay: delay || "0s", transformOrigin: origin } });
  let fig;
  if (kind === "run" || kind === "walk") {
    const s = kind === "run" ? ".5s" : ".95s";
    fig = (<>
      <g {...anim("ex-bob", s)}>
        <circle cx="31" cy="15" r="5" fill={ink} />
        {L(31, 20, 30, 34)}
        {L(30, 24, 39, 29, anim("ex-armf", s, "30px 24px"))}
        {L(30, 24, 22, 30, anim("ex-armb", s, "30px 24px"))}
      </g>
      {L(30, 34, 37, 48, anim("ex-legf", s, "30px 34px"))}
      {L(30, 34, 23, 48, anim("ex-legb", s, "30px 34px"))}
    </>);
  } else if (kind === "squat") {
    fig = (<g {...anim("ex-squat", "1.6s", "30px 50px")}>
      <circle cx="30" cy="15" r="5" fill={ink} />
      {L(30, 20, 30, 32)}{L(30, 24, 41, 25)}{L(30, 32, 24, 48)}{L(30, 32, 36, 48)}
    </g>);
  } else if (kind === "jump") {
    fig = (<g {...anim("ex-jump", ".7s", "30px 30px")}>
      <circle cx="30" cy="14" r="5" fill={ink} />
      {L(30, 19, 30, 33)}
      {L(30, 22, 20, 15, anim("ex-spread-neg", ".7s", "30px 22px"))}
      {L(30, 22, 40, 15, anim("ex-spread", ".7s", "30px 22px"))}
      {L(30, 33, 24, 47, anim("ex-spread-neg", ".7s", "30px 33px"))}
      {L(30, 33, 36, 47, anim("ex-spread", ".7s", "30px 33px"))}
    </g>);
  } else if (kind === "flow") {
    fig = (<g {...anim("ex-sway", "2.6s", "30px 50px")}>
      <circle cx="30" cy="15" r="5" fill={ink} />
      {L(30, 20, 30, 36)}{L(30, 24, 22, 31)}{L(30, 24, 39, 19)}{L(30, 36, 24, 50)}{L(30, 36, 36, 50)}
    </g>);
  } else if (kind === "breath") {
    fig = (<>
      <circle cx="30" cy="30" r="16" fill="none" stroke={ink} strokeWidth="2" {...anim("ex-breathe", "3.6s", "30px 30px")} />
      <circle cx="30" cy="30" r="10" fill="none" stroke={ink} strokeWidth="2" {...anim("ex-breathe", "3.6s", "30px 30px", "-.5s")} />
      <circle cx="30" cy="30" r="4" fill={ink} {...anim("ex-pulse", "3.6s", "30px 30px")} />
    </>);
  } else {
    fig = (<g {...anim("ex-pulse", "2.8s", "32px 38px")}>
      <circle cx="15" cy="34" r="5" fill={ink} />
      {L(19, 35, 45, 30)}{L(20, 35, 18, 46)}{L(45, 30, 53, 45)}{L(45, 30, 49, 46)}
    </g>);
  }
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} className="exdemo" style={{ background: C.greenL, borderRadius: 12, flex: "0 0 auto", display: "block" }} aria-hidden="true">{fig}</svg>
  );
};
const Pill = ({ children, tone = "green" }) => {
  const m = { green: { bg: C.greenL, fg: C.ink }, gold: { bg: C.goldBg, fg: "#96702A" }, clay: { bg: "#F6E4DC", fg: "#A24E37" }, plain: { bg: "#F1EFE7", fg: C.muted } }[tone];
  return <span style={{ background: m.bg, color: m.fg, fontSize: 11, fontWeight: 600, padding: "5px 11px", borderRadius: 100, display: "inline-block" }}>{children}</span>;
};
const Card = ({ children, style }) => <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, boxShadow: SH, padding: 18, marginBottom: 14, ...style }}>{children}</div>;
const Eyebrow = ({ children }) => <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.gold, marginBottom: 7 }}>{children}</div>;
const H1 = ({ children }) => <h1 style={{ fontFamily: serif, fontSize: 27, fontWeight: 600, color: C.ink, margin: "0 0 5px", lineHeight: 1.12 }}>{children}</h1>;
const SectionH = ({ icon, children }) => <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, fontFamily: serif, fontSize: 16, fontWeight: 600, color: C.ink }}>{icon}{children}</div>;
const Field = ({ label, children }) => <div style={{ marginBottom: 15 }}><label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 7, color: C.text }}>{label}</label>{children}</div>;
const Disc = () => <p style={{ fontSize: 11.5, color: C.muted, textAlign: "center", padding: "14px 22px 4px", lineHeight: 1.55 }}>Quiete organizza i piani delle tue nutrizioniste e traccia i progressi. I valori nutrizionali sono stime. Non sostituisce medico o nutrizionista.</p>;

function MacroBar({ label, g, target, color }) {
  const pct = target > 0 ? Math.min(100, (g / target) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}><span style={{ color: C.text }}>{label}</span><span style={{ color: C.muted, fontWeight: 600 }}>{r0(g)} / {r0(target)} g</span></div>
      <div style={{ height: 7, background: "#EBE5D8", borderRadius: 100, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: color, transition: ".4s" }} /></div>
    </div>
  );
}
function KcalRing({ value, target }) {
  const R = 40, C0 = 2 * Math.PI * R, frac = Math.min(value / target, 1), off = C0 * (1 - frac);
  return (
    <div style={{ position: "relative", width: 108, height: 108, flex: "0 0 auto" }}>
      <svg width="108" height="108" viewBox="0 0 108 108" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="54" cy="54" r={R} fill="none" stroke={C.greenL} strokeWidth="10" />
        <circle cx="54" cy="54" r={R} fill="none" stroke={C.ink} strokeWidth="10" strokeLinecap="round" strokeDasharray={C0} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{r0(value)}</div>
        <div style={{ fontSize: 9.5, color: C.muted, marginTop: 2 }}>/ {target} kcal</div>
      </div>
    </div>
  );
}
function Ring({ frac, big, small }) {
  const R = 86, C0 = 2 * Math.PI * R, off = C0 * (1 - frac);
  return (
    <div style={{ position: "relative", width: 196, height: 196 }}>
      <svg width="196" height="196" viewBox="0 0 196 196" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="98" cy="98" r={R} fill="none" stroke={C.greenL} strokeWidth="13" />
        <circle cx="98" cy="98" r={R} fill="none" stroke={C.ink} strokeWidth="13" strokeLinecap="round" strokeDasharray={C0} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 600, color: C.ink }}>{big}</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{small}</div>
      </div>
    </div>
  );
}
function useFasting(lastMeal) {
  if (!lastMeal) return { frac: 0, label: "—", status: "Nessun pasto registrato", tone: { bg: C.greenL, fg: C.ink }, icon: <Clock size={16} />, sub: "Registra un pasto per avviare il timer. Obiettivo: 12–14h di digiuno notturno." };
  const mins = (Date.now() - lastMeal) / 60000, h = Math.floor(mins / 60), m = Math.floor(mins % 60);
  const label = `${h}:${String(m).padStart(2, "0")}`, frac = Math.min(mins / (13 * 60), 1);
  if (mins < 90) return { frac, label, status: "Digestione in corso", tone: { bg: C.greenL, fg: C.ink }, icon: <Clock size={16} />, sub: "Lascia lavorare la digestione. Tra poco parte l'onda pulente." };
  if (mins < 240) return { frac, label, status: "Onda pulente attiva (MMC)", tone: { bg: C.goldBg, fg: "#96702A" }, icon: <RefreshCw size={16} />, sub: "Il complesso motorio migrante ripulisce il tenue. Se puoi, non mangiare ora." };
  if (mins < 720) return { frac, label, status: "Riposo intestinale", tone: { bg: C.greenL, fg: C.ink }, icon: <Leaf size={16} />, sub: "Ottimo intervallo tra i pasti. Bevi acqua o tisana." };
  return { frac, label, status: "Digiuno notturno completato", tone: { bg: C.greenL, fg: C.ok }, icon: <Check size={16} />, sub: "Superate le 12h. Colazione quando vuoi." };
}
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m) => { setMsg(m); clearTimeout(window.__qt); window.__qt = setTimeout(() => setMsg(null), 2100); };
  const node = (<div style={{ position: "fixed", bottom: 92, left: "50%", transform: `translateX(-50%) translateY(${msg ? 0 : 20}px)`, opacity: msg ? 1 : 0, transition: ".3s", background: C.ink, color: "#fff", padding: "12px 20px", borderRadius: 100, fontSize: 13, fontWeight: 600, zIndex: 80, boxShadow: SHL, display: "flex", gap: 8, alignItems: "center", pointerEvents: "none" }}><Check size={16} /> {msg}</div>);
  return { show, node };
}

const btnPrimary = { width: "100%", background: C.ink, color: "#fff", border: "none", borderRadius: 100, padding: "15px 22px", fontFamily: sans, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: SH };
const btnGhost = { marginTop: 13, background: "none", border: `1px solid ${C.line}`, color: C.muted, fontSize: 12.5, fontWeight: 600, padding: "9px 16px", borderRadius: 100, cursor: "pointer", fontFamily: sans, display: "inline-flex", alignItems: "center", gap: 6 };
const quickBtn = { background: "#F7FAF6", border: `1px solid ${C.line}`, borderRadius: 15, padding: "13px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: sans };
const input = { width: "100%", border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, fontFamily: sans, fontSize: 14.5, background: "#fff", color: C.text, resize: "vertical" };
const stepBtn = { width: 26, height: 26, borderRadius: 100, border: "none", background: C.greenL, color: C.ink, fontSize: 16, fontWeight: 700, cursor: "pointer", lineHeight: 1 };
