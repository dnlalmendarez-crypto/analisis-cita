import { runAnthropicAudit } from "./anthropic";
import { runGeminiAudit } from "./gemini";
import { LlmError, type RunAuditParams } from "./types";

export * from "./types";

export async function runAudit(params: RunAuditParams): Promise<string> {
  if (!params.apiKey || !params.apiKey.trim()) {
    throw new LlmError("Falta la API key del proveedor seleccionado.", 400);
  }
  if (params.provider === "anthropic") return runAnthropicAudit(params);
  if (params.provider === "google") return runGeminiAudit(params);
  throw new LlmError(`Proveedor no soportado: ${params.provider}`, 400);
}
