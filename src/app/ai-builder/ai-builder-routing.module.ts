import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AiBuilderComponent } from "./ai-builder.component";
import { AiBuilderProjectListComponent } from "./project-list/ai-builder-project-list.component";

const routes: Routes = [
  {
    path: "",
    component: AiBuilderProjectListComponent,
    data: { titlebarTitle: "AI Builder", titlebarSubtitle: "Projects" },
  },
  {
    path: ":projectId",
    component: AiBuilderComponent,
    data: { titlebarTitle: "AI Builder", titlebarSubtitle: "Editor" },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AiBuilderRoutingModule {}
