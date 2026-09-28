import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODELS, LlmError, type RunAuditParams } from "./types";

export async function runAnthropicAudit(params: RunAuditParams): Promise<string> {
  const client = new Anthropic({ apiKey: params.apiKey });
  const model = params.model || DEFAULT_MODELS.anthropic;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 8000,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.userContent }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    if (!text.trim()) {
      throw new LlmError("Claude devolvió una respuesta vacía.");
    }
    return text;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof Anthropic.APIError) {
      throw new LlmError(`Error de la API de Claude (${err.status}): ${err.message}`, err.status ?? 502);
    }
    throw new LlmError(`No se pudo contactar a la API de Claude: ${(err as Error).message}`);
  }
}
