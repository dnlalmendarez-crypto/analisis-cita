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
  // gemini-2.5-pro was retired for new users (the API pointed us to
  // gemini-3.1-pro-preview), but that pro-tier model has a zero free-tier quota
  // and 429s immediately on API keys without billing enabled. Default to the
  // flash tier instead, which Google typically keeps usable on the free tier;
  // users with billing enabled can switch to a pro model in Ajustes.
  google: "gemini-flash-latest",
};

export class LlmError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = "LlmError";
  }
}
