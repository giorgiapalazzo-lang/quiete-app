# Clinical Dietetics Workflow — riferimento per il motore nutrizionale

> Fonte: ricerca "Clinical Dietetics Workflow" (5 agenti paralleli su ISSN, EFSA, ACSM,
> ESPEN, AND/ANDID, Academy of Nutrition and Dietetics). Artifact originale:
> https://claude.ai/code/artifact/8ed88c64-f24e-43f9-95aa-58c647dea6ec
>
> Questo doc è la **specifica di calibrazione** di `lib/nutrition/engine.ts`.
> Ogni numero nel motore deve tracciare a una riga qui sotto. NON semplificare senza aggiornare qui.

## 1. BMR / REE
- **Default: Mifflin-St Jeor (1990)** — più accurato per popolazioni moderne (ADA 2005, entro 10% nell'82% dei non-obesi).
  - Uomo:  `10·peso + 6.25·altezza − 5·età + 5`
  - Donna: `10·peso + 6.25·altezza − 5·età − 161`
- **Katch-McArdle** quando è nota la massa grassa (BIA/plicometria): `370 + 21.6·LBM`, `LBM = peso·(1 − BF%)`. Preferito per atleti/bassa % grasso.
- Harris-Benedict rivista: alternativa, tende a sovrastimare del 5–15% nei sedentari.

## 2. TDEE — moltiplicatori attività (PAL)
| Livello | ×BMR |
|---|---|
| Sedentario | 1.2 |
| Leggero | 1.375 |
| Moderato | 1.55 |
| Attivo (very active) | 1.725 |
| Molto attivo (extreme) | 1.9 |
| Atleta professionista | 2.3 |

⚠️ **Correzione chiave:** le persone sovrastimano l'attività in media del **51%**. In onboarding
**default a un livello più basso** dell'auto-dichiarato (o calibra sui passi). → altrimenti le kcal escono troppo alte.

## 3. Aggiustamento calorico per obiettivo
| Obiettivo | Aggiustamento | Ritmo target |
|---|---|---|
| Dimagrimento (conservativo) | **−10…−20% del TDEE** | 0.5–1% peso/sett |
| Dimagrimento (moderato) | −500…−750 kcal/die | 0.5–1.0 kg/sett |
| Dimagrimento (aggressivo) | −25…−40% TDEE | solo con proteine alte + pesi |
| Mantenimento | 0 (TDEE) | ±0.5 kg |
| Massa (lean bulk) | **+200…+300 kcal/die** (NON %) | 0.25–0.5% peso/sett |
| Massa (principiante) | +300…+500 kcal/die | 0.5–1.0 kg/mese |
| Ricomposizione | TDEE o leggero deficit | peso stabile, composizione migliora |

**Floor kcal:** donne 1000–1200 (mai sotto senza medico), uomini 1200–1600.
Deficit >1000 kcal/die o calo >1 kg/sett → rischio perdita muscolare.

## 4. Proteine (g/kg/die)
| Popolazione | g/kg | Fonte |
|---|---|---|
| Sedentari (RDA) | 0.8 (EFSA 0.83) | IOM/EFSA |
| Chi si allena | 1.4–2.0 | ISSN 2017 |
| Ipertrofia ottimale | 1.6–2.4 (plateau ~1.62) | Morton 2018 |
| In deficit (allenato) | 1.6–2.2 g/kg peso (o 2.3–3.1 g/kg LBM) | ISSN |
| Anziani 65+ sani | 1.0–1.2 | ESPEN/PROT-AGE |
| Anziani malati/sarcopenia | 1.2–1.5 | ESPEN |
| Gravidanza 2°-3° trim | 1.1–1.5 | IOM |
| PCOS | 1.5–2.2 | trial clinici |
| Menopausa | 1.1–1.5 | BMS |

Per pasto: 0.25 g/kg o 20–40 g; anziani ~0.40 g/kg o 30–40 g. Distribuire ogni 3–4 h.

## 5. Ripartizione macro per obiettivo (%E)
| Obiettivo | Prot | Carbo | Grassi |
|---|---|---|---|
| Salute generale | 15–20 | 45–55 | 25–35 |
| Dimagrimento | 25–30 | 35–45 | 25–35 |
| Ricomposizione | 30–35 | 30–40 | 25–35 |
| Massa | 25–30 | 40–55 | 20–30 |
| Endurance | 15–20 | 50–65 | 20–30 |
| PCOS / insulino-resistenza | 25–35 | 30–45 | 25–40 (low-GI, sat <10%) |

Range di riferimento: IOM AMDR — Prot 10–35, Carbo 45–65, Grassi 20–35.

## 6. Archetipi dieta (macro %C/%P/%F + indicazioni)
| Pattern | C / P / F | Indicazioni | Controindicazioni | Evidenza |
|---|---|---|---|---|
| Mediterranea | 45–55 / 15–20 / 25–35 | CVD, T2DM, sindrome metabolica, gut, PCOS | nessuna assoluta | Altissima (PREDIMED) |
| DASH | ~55 / ~18 / ~27 | ipertensione, CVD | CKD cautela K; Na 1500–2300 mg | Altissima |
| Chetogenica | 5–10 / 20–25 / 70–75 | epilessia farmaco-resistente, T2DM | molte (gravidanza, T1DM, SGLT2i…) | Alta (epilessia) |
| High-protein | 35–45 / >25–30 / 25–35 | dimagrimento (preserva muscolo), sarcopenia | CKD preesistente | Moderata-alta |
| Plant-based | 50–65 / 10–15 / 20–30 | CVD, T2DM, peso | B12 obbligatoria; ferro/Ca/D/omega3 | Moderata |
| Intermittent fasting | pattern | obesità, sindrome metabolica | DCA, T1DM, gravidanza | Bassa-moderata |
| Zone 40-30-30 | 40 / 30 / 30 | T2DM, infiammazione | rigido | Bassa |

Gerarchia evidenza: Mediterranea > DASH > Cheto(epilessia) > Plant > High-protein > IF > Zone.
Base italiana (CREA/ANDID 2018): pattern **mediterraneo** come fondamento.

## 7. Pasti e timing
- Distribuzione proteica **uniforme ogni 3–4 h**, 3–4 pasti da 20–40 g.
- Distribuzione calorica **anticipata** (più al mattino) → minore sindrome metabolica; mangiare di notte = rischio maggiore.
- Meta-analisi 29 RCT (n=2485): più calo peso con time-restricted eating, minore frequenza pasti, distribuzione anticipata.

## 8. Carboidrati per carico allenamento (g/kg/die) — ACSM/AND/DC 2016
| Contesto | g/kg |
|---|---|
| Riposo/recupero | 3 |
| Bassa intensità | 3–5 |
| Moderato ~1h | 5–7 |
| Moderato-alto 1–3h | 6–10 |
| Ultra >4h | 8–12 |

## 9. Popolazioni speciali (kcal/nutrienti extra)
- **Gravidanza:** 1° trim +0; 2° +340 kcal; 3° +450 kcal. Ferro 27 mg, folato 600 mcg, carbo min 175 g.
- **Menopausa:** proteine 1.1–1.5 g/kg, Ca ≥1200 mg, vit D 800–2000 UI.
- **Anziani:** proteine 1.0–1.2 (sani) / 1.2–1.5 (malati), 30–40 g/pasto + ≥3 g leucina.

## 10. Monitoraggio
- Peso: medie settimanali / trend 2–4 sett (non singolo dato), stessa bilancia, mattino, a digiuno.
- Composizione corporea (FM vs FFM), circonferenza vita, foto mensili, diario, marker (HbA1c, lipidi).
- Frequenza rivalutazione: outpatient ogni 2–4 sett.
