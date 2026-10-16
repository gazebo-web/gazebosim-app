import { Component, ViewEncapsulation } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

export interface NewProjectResult {
  name: string;
  description: string;
  gazebo_version: string;
  sdf_version: string;
  ros2_distro: string;
}

const GAZEBO_TO_SDF_ROS: Record<string, { sdf: string; ros: string }> = {
  Harmonic: { sdf: "1.9", ros: "Jazzy" },
  Fortress: { sdf: "1.8", ros: "Humble" },
};

@Component({
  selector: "new-project-dialog",
  templateUrl: "./new-project-dialog.component.html",
  styleUrls: ["./new-project-dialog.component.scss"],
  // Dialogs render in a CDK overlay outside this component's DOM, so
  // Angular's emulated view encapsulation wouldn't apply the scoped
  // styles. Disable encapsulation and scope via the `.new-project-dialog`
  // class below.
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class NewProjectDialogComponent {
  name = "";
  description = "";
  gazeboVersion = "Harmonic";

  readonly gazeboOptions = Object.keys(GAZEBO_TO_SDF_ROS);

  constructor(
    private ref: MatDialogRef<NewProjectDialogComponent, NewProjectResult>,
  ) {}

  get sdfVersion(): string {
    return GAZEBO_TO_SDF_ROS[this.gazeboVersion]?.sdf || "1.9";
  }

  get ros2Distro(): string {
    return GAZEBO_TO_SDF_ROS[this.gazeboVersion]?.ros || "Jazzy";
  }

  cancel(): void {
    this.ref.close();
  }

  create(): void {
    if (!this.name.trim()) return;
    this.ref.close({
      name: this.name.trim(),
      description: this.description.trim(),
      gazebo_version: this.gazeboVersion,
      sdf_version: this.sdfVersion,
      ros2_distro: this.ros2Distro,
    });
  }
}
