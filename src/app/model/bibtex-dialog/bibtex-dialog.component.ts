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
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = this.data.bibtex;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.snackBar.open("BibTeX copied to clipboard.", "", { duration: 2000 });
  }

  public close(): void {
    this.dialogRef.close();
  }
}
