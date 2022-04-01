import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'gz-copy-dialog',
  templateUrl: 'copy-dialog.component.html',
  styleUrls: ['copy-dialog.component.scss']
})

/**
 * The Copy Dialog is used to ask the user to enter a new name and owner for the copied resource.
 * It has a "busy state" that can display an animation with a message.
 */
export class CopyDialogComponent {

  /**
   * Event emitter when the submit button is clicked.
   */
  @Output() public onSubmit = new EventEmitter<any>();

  /**
   * The busy state allows to display an animation and a message. Useful when the user
   * should wait for the response of an asynchronous call.
   */
  private busyState: boolean = false;

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *
   *        - title (string) Dialog title.
   *        - message (string) Dialog message.
   *        - name (string) The value of the name input field.
   *        - namePlaceholder (string) Placeholder for the name input.
   *        - owner (string) The owner of the copy.
   *        - ownerList (string[]) The list of possible owners of the copy.
   *        - busyMessage (string) Message to display in busy state, below the animation.
   */
  constructor(
    public dialog: MatDialogRef<CopyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  /**
   * Set the busy state.
   *
   * @param state The boolean state to be set.
   */
  public set busy(state: boolean) {
    this.busyState = state;
  }

  /**
   * Get the busy state.
   *
   * @returns The current busy state.
   */
  public get busy(): boolean {
    return this.busyState;
  }

  /**
   * Callback for the submit button click. Emits an onSubmit event.
   */
  public submit(): void {
    const copyData = {
      copyName: this.data.name,
      copyOwner: this.data.owner
    };
    this.onSubmit.emit(copyData);
  }
}
