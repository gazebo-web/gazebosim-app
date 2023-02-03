import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'gz-access-token-dialog',
  templateUrl: 'access-token-dialog.component.html',
  styleUrls: ['access-token-dialog.component.scss'],
  standalone: true,
  imports: [
    FlexLayoutModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
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
