export type LlmProvider = "anthropic" | "google";

export interface RunAuditParams {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
  systemPrompt: string;
  userContent: string;
}

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-sonnet-5",
  // gemini-2.5-pro was retired for new users; the Gemini API itself now points
  // new integrations to gemini-3.1-pro-preview.
  google: "gemini-3.1-pro-preview",
};

export class LlmError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = "LlmError";
  }
}
