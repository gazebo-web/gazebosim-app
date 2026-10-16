import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

import { LLMKeyInput } from "../ai-builder.service";

const PROVIDERS: { value: string; label: string; needsKey: boolean }[] = [
  { value: "anthropic", label: "Anthropic (Claude)", needsKey: true },
  { value: "openai", label: "OpenAI", needsKey: true },
  { value: "gemini", label: "Google Gemini", needsKey: true },
  { value: "ollama", label: "Ollama (local)", needsKey: false },
];

@Component({
  selector: "ai-builder-add-key-dialog",
  templateUrl: "./add-key-dialog.component.html",
  styleUrls: ["./add-key-dialog.component.scss"],
  standalone: false,
})
export class AddKeyDialogComponent {
  readonly providers = PROVIDERS;
  provider = "anthropic";
  apiKey = "";
  endpoint = "";

  constructor(
    private ref: MatDialogRef<AddKeyDialogComponent, LLMKeyInput | null>,
  ) {}

  get needsKey(): boolean {
    return (
      this.providers.find((p) => p.value === this.provider)?.needsKey ?? true
    );
  }

  get canSubmit(): boolean {
    if (this.needsKey) return this.apiKey.trim().length > 0;
    // Ollama: endpoint optional (defaults to localhost:11434 server-side)
    return true;
  }

  cancel(): void {
    this.ref.close(null);
  }

  submit(): void {
    if (!this.canSubmit) return;
    const body: LLMKeyInput = { provider: this.provider };
    if (this.apiKey.trim()) body.api_key = this.apiKey.trim();
    if (this.endpoint.trim()) body.endpoint = this.endpoint.trim();
    this.ref.close(body);
  }
}
