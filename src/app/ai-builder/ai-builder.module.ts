import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { RouterModule } from "@angular/router";

import { AiBuilderRoutingModule } from "./ai-builder-routing.module";
import { AiBuilderComponent } from "./ai-builder.component";
import { AiBuilderProjectListComponent } from "./project-list/ai-builder-project-list.component";
import { AiBuilderViewportComponent } from "./viewport/ai-builder-viewport.component";
import { ExecutionPanelComponent } from "./execution-panel/execution-panel.component";
import { GazeboConnectionDialogComponent } from "./gazebo-connection-dialog/gazebo-connection-dialog.component";
import { GitHubExportDialogComponent } from "./github-export-dialog/github-export-dialog.component";
import { LlmSettingsModule } from "./llm-settings/llm-settings.module";
import { NewProjectDialogComponent } from "./new-project-dialog/new-project-dialog.component";
import { VersionHistoryComponent } from "./version-history/version-history.component";

@NgModule({
  declarations: [
    AiBuilderComponent,
    AiBuilderProjectListComponent,
    AiBuilderViewportComponent,
    ExecutionPanelComponent,
    GazeboConnectionDialogComponent,
    GitHubExportDialogComponent,
    NewProjectDialogComponent,
    VersionHistoryComponent,
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
    MatMenuModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterModule,
  ],
})
export class AiBuilderModule {}
