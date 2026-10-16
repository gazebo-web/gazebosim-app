import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { AddKeyDialogComponent } from "./add-key-dialog.component";
import { LlmSettingsComponent } from "./llm-settings.component";

/**
 * A dedicated module for the LLM settings panel so it can be imported both
 * by the lazy-loaded AI Builder feature module and the eagerly-loaded
 * SettingsComponent in the app shell without causing Angular's "multiple
 * declarations" error.
 */
@NgModule({
  declarations: [AddKeyDialogComponent, LlmSettingsComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  exports: [LlmSettingsComponent],
})
export class LlmSettingsModule {}
