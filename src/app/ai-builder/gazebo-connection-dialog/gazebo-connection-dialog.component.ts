import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface GazeboConnectionDialogData {
  url: string;
  key: string;
}

@Component({
  selector: "gazebo-connection-dialog",
  templateUrl: "./gazebo-connection-dialog.component.html",
  styleUrls: ["./gazebo-connection-dialog.component.scss"],
  standalone: false,
})
export class GazeboConnectionDialogComponent {
  url = "";
  key = "";

  constructor(
    private ref: MatDialogRef<
      GazeboConnectionDialogComponent,
      GazeboConnectionDialogData | null
    >,
    @Inject(MAT_DIALOG_DATA) data: GazeboConnectionDialogData,
  ) {
    this.url = data?.url || "";
    this.key = data?.key || "";
  }

  cancel(): void {
    this.ref.close(null);
  }

  disconnect(): void {
    this.ref.close({ url: "", key: "" });
  }

  save(): void {
    this.ref.close({ url: this.url.trim(), key: this.key.trim() });
  }
}
