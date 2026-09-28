import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_MODELS, LlmError, type RunAuditParams } from "./types";

export async function runGeminiAudit(params: RunAuditParams): Promise<string> {
  const model = params.model || DEFAULT_MODELS.google;
  const genAI = new GoogleGenerativeAI(params.apiKey);

  try {
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: params.systemPrompt,
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: params.userContent }] }],
      generationConfig: { maxOutputTokens: 8192 },
    });

    const text = result.response.text();
    if (!text.trim()) {
      throw new LlmError("Gemini devolvió una respuesta vacía.");
    }
    return text;
  } catch (err) {
    if (err instanceof LlmError) throw err;
    throw new LlmError(`No se pudo contactar a la API de Gemini: ${(err as Error).message}`);
  }
}
