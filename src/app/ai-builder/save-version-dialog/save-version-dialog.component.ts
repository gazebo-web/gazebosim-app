import { Component, ViewEncapsulation } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

/**
 * Themed replacement for the `window.prompt()` that previously asked
 * the user for a commit message on Save. Returns the entered (and
 * trimmed) message via MatDialogRef.close, or undefined on cancel —
 * caller distinguishes "user cancelled" from "user saved with empty
 * message" by checking for undefined vs string.
 */
@Component({
  selector: "save-version-dialog",
  templateUrl: "./save-version-dialog.component.html",
  styleUrls: ["./save-version-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class SaveVersionDialogComponent {
  message = "snapshot";

  constructor(private ref: MatDialogRef<SaveVersionDialogComponent, string>) {}

  cancel(): void {
    this.ref.close();
  }

  save(): void {
    const trimmed = this.message.trim();
    // Empty messages collapse to "snapshot" so the git log doesn't get
    // a blank-message commit. Matches the previous prompt() flow which
    // defaulted the input to "snapshot".
    this.ref.close(trimmed || "snapshot");
  }
}
