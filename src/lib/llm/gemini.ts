import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MODELS, LlmError, type RunAuditParams } from "./types";

export async function runGeminiAudit(params: RunAuditParams): Promise<string> {
  const model = params.model || DEFAULT_MODELS.google;
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: params.userContent,
      config: {
        systemInstruction: params.systemPrompt,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text;
    if (!text || !text.trim()) {
      throw new LlmError("Gemini devolvió una respuesta vacía.");
    }
    return text;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    throw new LlmError(`No se pudo contactar a la API de Gemini: ${(err as Error).message}`);
  }
}
