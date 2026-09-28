import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/promptRouter";
import { getSpecialtyConfig, type SpecialtyId, SPECIALTIES } from "@/lib/specialties";
import { runAudit, LlmError, type LlmProvider } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AuditRequestBody {
  nota: string;
  transcripcion: string;
  specialty: SpecialtyId;
  provider: LlmProvider;
  model?: string;
}

const SUPPORTED_SPECIALTY_IDS: SpecialtyId[] = SPECIALTIES.filter((s) => s.supported).map((s) => s.id);

export async function POST(req: NextRequest) {
  let body: AuditRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido." }, { status: 400 });
  }

  const { nota, transcripcion, specialty, provider, model } = body;

  if (!nota?.trim() || !transcripcion?.trim()) {
    return NextResponse.json(
      { error: "Sube ambos para iniciar el análisis (Nota Médica y Transcripción)." },
      { status: 400 }
    );
  }

  if (!specialty || !SPECIALTIES.some((s) => s.id === specialty)) {
    return NextResponse.json({ error: "Especialidad no reconocida." }, { status: 400 });
  }

  const specialtyConfig = getSpecialtyConfig(specialty);
  if (!specialtyConfig.supported) {
    return NextResponse.json(
      {
        pending: true,
        message: `El módulo de auditoría para "${specialtyConfig.label}" todavía no ha sido configurado (falta subir su prompt y documentos de referencia). Por ahora está disponible para: ${SUPPORTED_SPECIALTY_IDS.map(
          (id) => getSpecialtyConfig(id).label
        ).join(", ")}.`,
      },
      { status: 200 }
    );
  }

  const apiKey = req.headers.get("x-provider-api-key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta la API key del proveedor. Configúrala en Ajustes." },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt(specialty);

  const userContent = `Especialidad detectada/seleccionada para esta auditoría: ${specialtyConfig.label}

--- NOTA MÉDICA (Registro) ---
${nota}

--- TRANSCRIPCIÓN (Transcript) ---
${transcripcion}

Genera el informe de auditoría siguiendo estrictamente el FORMATO DE SALIDA indicado en tus instrucciones.`;

  try {
    const report = await runAudit({
      provider,
      apiKey,
      model,
      systemPrompt,
      userContent,
    });
    return NextResponse.json({ report });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: `Error inesperado: ${(err as Error).message}` }, { status: 500 });
  }
}
