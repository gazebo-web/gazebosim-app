import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import { AuthService } from "../../auth/auth.service";
import { ConfirmationDialogComponent } from "../../confirmation-dialog/confirmation-dialog.component";
import { AiBuilderService, LLMKey, LLMKeyInput } from "../ai-builder.service";
import { AddKeyDialogComponent } from "./add-key-dialog.component";

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI",
  gemini: "Google Gemini",
  ollama: "Ollama (local)",
};

/**
 * Manages the user's LLM API keys: lists them, lets the user add a new one,
 * and delete existing keys. Used on both the Settings page and the AI Builder
 * project list page.
 */
@Component({
  selector: "ai-builder-llm-settings",
  templateUrl: "./llm-settings.component.html",
  styleUrls: ["./llm-settings.component.scss"],
  standalone: false,
})
export class LlmSettingsComponent implements OnInit {
  loading = true;
  error = "";
  keys: LLMKey[] = [];

  constructor(
    private service: AiBuilderService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  private username(): string {
    return (
      (this.auth as unknown as { userProfile?: { username?: string } })
        .userProfile?.username || ""
    );
  }

  reload(): void {
    const user = this.username();
    if (!user) {
      this.loading = false;
      this.keys = [];
      return;
    }
    this.loading = true;
    this.service.listLLMKeys(user).subscribe({
      next: (keys) => {
        this.keys = keys || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = this.describeError(err);
        this.loading = false;
      },
    });
  }

  providerLabel(p: string): string {
    return PROVIDER_LABELS[p] || p;
  }

  addKey(): void {
    const user = this.username();
    if (!user) {
      this.error = "You must be signed in to add a key.";
      return;
    }
    const ref = this.dialog.open(AddKeyDialogComponent, { width: "480px" });
    ref.afterClosed().subscribe((result: LLMKeyInput | null) => {
      if (!result) return;
      this.service.addLLMKey(user, result).subscribe({
        next: () => {
          this.snack.open("Key saved.", "Dismiss", { duration: 2000 });
          this.reload();
        },
        error: (err) => (this.error = this.describeError(err)),
      });
    });
  }

  deleteKey(key: LLMKey): void {
    const user = this.username();
    if (!user) return;
    const label = this.providerLabel(key.provider);

    const ref = this.dialog.open<
      ConfirmationDialogComponent,
      unknown,
      boolean | undefined
    >(ConfirmationDialogComponent, {
      width: "420px",
      data: {
        title: "Delete API Key",
        message: `Delete your <strong>${label}</strong> key? This can't be undone.`,
        buttonText: "Delete",
        hasInput: false,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.deleteLLMKey(user, key.provider).subscribe({
        next: () => {
          this.snack.open("Key removed.", "Dismiss", { duration: 2000 });
          this.reload();
        },
        error: (err) => (this.error = this.describeError(err)),
      });
    });
  }

  private describeError(err: unknown): string {
    const e = err as {
      status?: number;
      error?: { error?: string } | string;
      message?: string;
    };
    if (e?.error && typeof e.error === "object" && e.error.error) {
      return `${e.status ?? "?"}: ${e.error.error}`;
    }
    if (typeof e?.error === "string" && e.error) {
      return `${e.status ?? "?"}: ${e.error}`;
    }
    return e?.message || "request failed";
  }
}
