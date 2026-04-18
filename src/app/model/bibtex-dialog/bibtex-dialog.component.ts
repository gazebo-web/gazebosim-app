import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

export interface BibtexDialogData {
  bibtex: string;
}

@Component({
  selector: "gz-bibtex-dialog",
  templateUrl: "bibtex-dialog.component.html",
  styleUrls: ["bibtex-dialog.component.scss"],
  standalone: false,
})
export class BibtexDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BibtexDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BibtexDialogData,
    private snackBar: MatSnackBar,
  ) {}

  public copy(): void {
    navigator.clipboard.writeText(this.data.bibtex).then(() => {
      this.snackBar.open("BibTeX copied to clipboard.", "", { duration: 2000 });
    });
  }

  public close(): void {
    this.dialogRef.close();
  }
}
