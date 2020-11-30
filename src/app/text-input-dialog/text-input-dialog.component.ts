import { Component, Inject, EventEmitter, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'ign-text-input-dialog',
  templateUrl: 'text-input-dialog.component.html',
})

/**
 * Dialog that allows the user to input a string. It can be configured for different use cases.
 * Useful for Admins to leave comments while rejecting a registration.
 *
 * Emits an onSubmit event when the positive action button is clicked. The event contains the
 * string.
 */
export class TextInputDialogComponent {

  /**
   * Used to emit an event when the registration form is complete. The registration
   * should be handled by the component that opened this dialog.
   */
  @Output() public onSubmit = new EventEmitter<string>();

  /**
   * The user input.
   */
  public input: string = '';

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *        - title (string) Dialog title.
   *        - message (string) The body of the Dialog.
   *        - inputPlaceholder (string) Placeholder for input field.
   *        - buttonText (string) Caption of the action button.
   */
  constructor(
    public dialog: MatDialogRef<TextInputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  /**
   * Emit the event that includes the input string.
   */
  public submit(): void {
    this.onSubmit.emit(this.input);
  }
}
