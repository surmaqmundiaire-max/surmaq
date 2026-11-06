// Lee la placa de datos de un equipo a partir de una foto, con Claude (visión + salida estructurada).
// Requiere ANTHROPIC_API_KEY en .env.local. Sin clave responde 503 y la maqueta usa datos de ejemplo.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

export const runtime = "nodejs";

const texto = z.string().nullable();

const PlacaSchema = z.object({
  legible: z.boolean().describe("false si la foto no muestra una placa o no se puede leer"),
  tipoEquipo: texto.describe("p. ej. compresor de tornillo, secador refrigerativo"),
  marca: texto,
  modelo: texto,
  serie: texto,
  anio: z.number().int().nullable().describe("año de fabricación"),
  potencia: texto.describe("con unidad, p. ej. 15 kW / 20 HP"),
  voltaje: texto.describe("con unidad, p. ej. 220/440 V"),
  frecuencia: texto,
  corriente: texto,
  presionMax: texto.describe("presión máxima o de trabajo, con unidad"),
  caudal: texto.describe("caudal o capacidad, con unidad"),
  otros: z.array(z.object({ etiqueta: z.string(), valor: z.string() })).describe("otros datos relevantes de la placa"),
  observaciones: texto.describe("dudas de lectura, partes ilegibles"),
});

export type LecturaPlaca = z.infer<typeof PlacaSchema>;

const INSTRUCCIONES = `Eres un asistente de servicio técnico de compresores y equipos de aire comprimido.
Lee la placa de datos (nameplate) de la foto y transcribe sus valores tal como aparecen, conservando unidades.
No inventes ni deduzcas valores que no estén escritos: si un dato no se ve o no es legible, déjalo en null.
Si un carácter es dudoso (p. ej. 0/O, 1/I, 5/S en la serie), transcribe tu mejor lectura y menciónalo en observaciones.
Responde en español.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "sin_clave" }, { status: 503 });
  }

  const { imagen } = (await req.json()) as { imagen?: string };
  const m = imagen?.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) return Response.json({ error: "imagen_invalida" }, { status: 400 });
  const mediaType = m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  const client = new Anthropic();
  try {
    const res = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: INSTRUCCIONES,
      output_config: { format: betaZodOutputFormat(PlacaSchema) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: m[2] } },
            { type: "text", text: "Lee esta placa de datos." },
          ],
        },
      ],
    });

    if (res.stop_reason === "refusal" || !res.parsed_output) {
      return Response.json({ error: "no_leida" }, { status: 422 });
    }
    return Response.json(res.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "sin_clave" }, { status: 503 });
    } else if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "limite" }, { status: 429 });
    } else if (error instanceof Anthropic.APIError) {
      console.error("leer-placa", error.status, error.message);
      return Response.json({ error: "api" }, { status: 502 });
    }
    throw error;
  }
}
