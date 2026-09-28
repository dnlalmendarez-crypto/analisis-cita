import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODELS, LlmError, type RunAuditParams } from "./types";

export async function runAnthropicAudit(params: RunAuditParams): Promise<string> {
  const client = new Anthropic({ apiKey: params.apiKey });
  const model = params.model || DEFAULT_MODELS.anthropic;

  try {
    const stream = client.messages.stream({
      model,
      // The audit prompt + reference anexos are already large and the strict
      // output format has many tables, so give the model plenty of room. Values
      // this high require streaming (the SDK enforces it) rather than a plain
      // messages.create call.
      max_tokens: 64000,
      system: params.systemPrompt,
      // Current models think adaptively by default even without an explicit
      // `thinking` param. On this task (a large, mechanical, rule-following
      // comparison, not open-ended reasoning) unrestrained thinking was
      // consuming the entire token budget before any report text was written,
      // producing thinking-only output. Capping effort leaves room for the
      // actual answer.
      output_config: { effort: "medium" },
      messages: [{ role: "user", content: params.userContent }],
    });

    const response = await stream.finalMessage();

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    if (!text.trim()) {
      const blockTypes = response.content.map((b) => b.type).join(", ") || "ninguno";
      throw new LlmError(
        `Claude devolvió una respuesta vacía (stop_reason: ${response.stop_reason ?? "desconocido"}, bloques recibidos: ${blockTypes}). Si stop_reason es "max_tokens", intenta con una transcripción/nota más corta o con otro modelo.`
      );
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
