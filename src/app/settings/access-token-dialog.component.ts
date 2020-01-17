import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'ign-access-token-dialog',
  templateUrl: 'access-token-dialog.component.html',
  styleUrls: ['access-token-dialog.component.scss']
})

/**
 * Access token confirmation dialog
 */
export class AccessTokenDialogComponent {

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *        - key (string) Token key value.
   */
  constructor(
    public dialog: MatDialogRef<AccessTokenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  /**
   * Copy the input element to the clipboard.
   * @param inputElement The element to copy.
   */
  public copy(inputElement): void {
    inputElement.select();
    document.execCommand('copy');
    inputElement.setSelectionRange(0, 0);
  }
}
