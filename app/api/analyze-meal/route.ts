import Anthropic from "@anthropic-ai/sdk";

// Route handler dinamica (POST non è mai in cache). La chiave Anthropic resta
// solo lato server: il client invia base64 + mime, qui parliamo con Claude.
export const runtime = "nodejs";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const ALLOWED: MediaType[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const DEFAULT_PROMPT = `Sei un dietista esperto. Analizza la foto di questo pasto e stima porzioni e valori nutrizionali usando il piatto e le posate come riferimento di scala. Rispondi SOLO con JSON valido, senza testo prima o dopo, in questo formato esatto:
{"piatto":"nome breve del piatto","alimenti":[{"nome":"alimento","grammi":120,"kcal":198,"proteine":30,"carboidrati":0,"grassi":8}],"totale":{"kcal":0,"proteine":0,"carboidrati":0,"grassi":0}}
Le grammature sono al netto degli scarti. Se nella foto non c'è cibo, restituisci "alimenti":[].`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY non configurata sul server." },
      { status: 503 },
    );
  }

  let body: { base64?: string; mime?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON non valido." }, { status: 400 });
  }

  const { base64, mime, prompt } = body;
  if (!base64 || !mime) {
    return Response.json(
      { error: "Immagine mancante (base64 + mime richiesti)." },
      { status: 400 },
    );
  }
  if (!ALLOWED.includes(mime as MediaType)) {
    return Response.json(
      { error: `Formato immagine non supportato: ${mime}` },
      { status: 400 },
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      // Sonnet: ottima visione per stimare porzioni/macro, molto più economico
      // di Opus per foto frequenti (i crediti durano di più).
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime as MediaType,
                data: base64,
              },
            },
            { type: "text", text: prompt || DEFAULT_PROMPT },
          ],
        },
      ],
    });

    const txt = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const clean = txt.replace(/```json|```/g, "").trim();

    try {
      return Response.json(JSON.parse(clean));
    } catch {
      return Response.json(
        { error: "Risposta del modello non in formato JSON.", raw: clean },
        { status: 502 },
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore analisi immagine.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
