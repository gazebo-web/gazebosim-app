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
import { RouterModule } from "@angular/router";

import { AiBuilderRoutingModule } from "./ai-builder-routing.module";
import { AiBuilderComponent } from "./ai-builder.component";
import { AiBuilderProjectListComponent } from "./project-list/ai-builder-project-list.component";
import { AiBuilderViewportComponent } from "./viewport/ai-builder-viewport.component";
import { LlmSettingsModule } from "./llm-settings/llm-settings.module";
import { NewProjectDialogComponent } from "./new-project-dialog/new-project-dialog.component";

@NgModule({
  declarations: [
    AiBuilderComponent,
    AiBuilderProjectListComponent,
    AiBuilderViewportComponent,
    NewProjectDialogComponent,
  ],
  imports: [
    AiBuilderRoutingModule,
    LlmSettingsModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterModule,
  ],
})
export class AiBuilderModule {}
