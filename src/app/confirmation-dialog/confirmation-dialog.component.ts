import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'gz-confirmation-dialog',
  templateUrl: 'confirmation-dialog.component.html',
  styleUrls: ['confirmation-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})

/**
 * Generic confirmation dialog which can be configured for different use-cases.
 */
export class ConfirmationDialogComponent {

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *        - hasInput (boolean) Whether this dialog requires an input or not
   *        - inputValue (string) Value of the input field in case the user needs to type a string
   *                              as confirmation.
   *        - inputTarget (string) In case there is an input, this is the value which the user
   *                               should type in order to enable the action button.
   *        - title (string) Dialog title
   *        - message (string) Dialog message
   *        - inputMessage (string) If dialog requires input, this is the input explanation text.
   *        - inputPlaceholder (string) Placeholder for input.
   */
  constructor(
    public dialog: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}
