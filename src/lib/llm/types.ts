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
  google: "gemini-2.5-pro",
};

export class LlmError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = "LlmError";
  }
}
