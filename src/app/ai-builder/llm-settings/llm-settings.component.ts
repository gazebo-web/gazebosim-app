import { Component, OnInit } from "@angular/core";

import { AuthService } from "../../auth/auth.service";
import { AiBuilderService, LLMConfig } from "../ai-builder.service";

interface ModelPreset {
  provider: string;
  model: string;
  label: string;
}

const MODEL_PRESETS: ModelPreset[] = [
  { provider: "anthropic", model: "claude-opus-4-7", label: "Claude Opus 4.7" },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
  },
  { provider: "openai", model: "gpt-4o", label: "GPT-4o" },
  { provider: "openai", model: "gpt-4o-mini", label: "GPT-4o mini" },
  { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { provider: "ollama", model: "llama3.1:8b", label: "Ollama (llama3.1:8b)" },
];

@Component({
  selector: "ai-builder-llm-settings",
  templateUrl: "./llm-settings.component.html",
  styleUrls: ["./llm-settings.component.scss"],
  standalone: false,
})
export class LlmSettingsComponent implements OnInit {
  readonly modelPresets = MODEL_PRESETS;
  loading = true;
  saving = false;
  saved = false;
  error = "";

  provider = "anthropic";
  model = "claude-sonnet-4-6";
  apiKey = "";
  endpoint = "";
  telemetryOptIn = false;
  maskedKey = "";

  constructor(
    private service: AiBuilderService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.username();
    if (!user) {
      this.loading = false;
      return;
    }
    this.service.getLLMConfig(user).subscribe({
      next: (cfg) => {
        if (cfg.provider) {
          this.provider = cfg.provider;
          this.model = cfg.model;
          this.endpoint = cfg.endpoint || "";
          this.maskedKey = cfg.api_key_masked || "";
          this.telemetryOptIn = !!cfg.telemetry_opt_in;
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private username(): string {
    return (
      (this.auth as unknown as { userProfile?: { username?: string } })
        .userProfile?.username || ""
    );
  }

  onProviderChange(): void {
    // Suggest a sensible model for the new provider.
    const first = MODEL_PRESETS.find((p) => p.provider === this.provider);
    if (first) this.model = first.model;
  }

  save(): void {
    const user = this.username();
    if (!user) {
      this.error = "You must be signed in to save LLM settings.";
      return;
    }
    this.saving = true;
    this.saved = false;
    const body: Partial<LLMConfig> & { api_key?: string } = {
      provider: this.provider,
      model: this.model,
      endpoint: this.endpoint,
      telemetry_opt_in: this.telemetryOptIn,
    };
    if (this.apiKey.trim()) body.api_key = this.apiKey.trim();
    this.service.putLLMConfig(user, body).subscribe({
      next: (cfg) => {
        this.maskedKey = cfg.api_key_masked || this.maskedKey;
        this.apiKey = "";
        this.saved = true;
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.message || "failed to save";
        this.saving = false;
      },
    });
  }

  remove(): void {
    const user = this.username();
    if (!user) return;
    if (
      !confirm(
        "Remove your stored LLM configuration? Your API key will be deleted.",
      )
    )
      return;
    this.service.deleteLLMConfig(user).subscribe({
      next: () => {
        this.provider = "anthropic";
        this.model = "claude-sonnet-4-6";
        this.apiKey = "";
        this.endpoint = "";
        this.maskedKey = "";
        this.telemetryOptIn = false;
        this.saved = false;
      },
      error: (err) => (this.error = err?.message || "failed to remove"),
    });
  }
}
