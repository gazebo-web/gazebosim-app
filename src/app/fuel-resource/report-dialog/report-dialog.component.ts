import { Component, EventEmitter, Output, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import {
  ConfirmationDialogComponent,
} from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'gz-report-dialog',
    templateUrl: 'report-dialog.component.html',
    styleUrls: ['report-dialog.component.scss']
})

/**
 * The report dialog is used to show a list of reasons where the user can
 * choose one to report a resource
 */
export class ReportDialogComponent {

  /**
   * Event emitter when the submit button is clicked.
   */
  @Output() public onSubmit = new EventEmitter<any>();

  /**
   * User's selection to report the model
   */
  public selectedOption: string;

  /**
   * List of reasons to report
   */
  public readonly reasons: string[] = [
    `Sexual Content`,
    `Illegal Activities`,
    `Child Safety Issues`,
    `Hateful or abusive content`,
    `Copyright/Legal violation`,
    `Shocking content`,
    `Incorrect/broken resource`,
    `I don't like this content`,
  ];

  /**
   * @param dialog Reference to the opened dialog.
   * @param confirmationDialog Reference to the confirmation
   * dialog opened after reporting a resource.
   * @param data Dialog properties:
   *    - title (string): Dialog title.
   *    - name (string): Reported resource name.
   *    - owner (string): Reported resource owner.
   */
  constructor(
    public dialog: MatDialog,
    public confirmationDialog: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  /**
   * Callback for the report button click. Opens a confirmation dialog.
   */
  public report(): void {
    if (!this.selectedOption) {
      return;
    }

    const options = {
      data: {
        title: `Report summary`,
        message: `<p>Are you sure you want to report model
        <b>${this.data.name}</b> created by <b>${this.data.owner}</b>
         due to <b>${this.selectedOption}</b>?</p>`,
        buttonText: 'Submit',
      },
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, options);

    this.confirmationDialog.afterClosed().subscribe(
      (result) => {
        if (!result) {
          return;
        }
        this.submit();
      },
    );
  }

  /**
   * Submit the data retrieved from dialog to parent component after confirmation
   */
  public submit(): void {
    this.onSubmit.emit({
      name: this.data.name,
      owner: this.data.owner,
      reason: this.selectedOption,
    });
  }
}
