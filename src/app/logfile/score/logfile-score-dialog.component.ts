import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MatSnackBar, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, Validators } from '@angular/forms';

import { AuthService } from '../../auth/auth.service';
import { Logfile, LogfileService } from '../../logfile';

@Component({
  selector: 'ign-logfile-score-dialog',
  templateUrl: 'logfile-score-dialog.component.html',
})

/**
 * The dialog used to score a logfile. It is a dialog, so the admin doesn't lose
 * the context of the Portal competition.
 */
export class LogfileScoreDialogComponent implements OnInit {

  /**
   * The logfile that will be scored.
   */
  public logfile: Logfile;

  /**
   * The new score of the logfile.
   */
  public logfileScore: number;

  /**
   * The form for the score input.
   */
  public scoreForm: FormControl = new FormControl('', {validators: Validators.required,
    updateOn: 'change' || 'submit'});

  /**
   * Whether the logfile is being modified or not.
   */
  public busy: boolean = false;

  /**
   * @param authService Service used to get information about the logged user.
   * @param data Data for the dialog. Fields:
   *        - logfile (Logfile) The logfile to get data from.
   * @param dialogRef Reference to the opened dialog.
   * @param logfileService Service used to interact with Logfiles from the Server.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    public authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<LogfileScoreDialogComponent>,
    public logfileService: LogfileService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * Get the logfile to score from the Dialog data.
   */
  public ngOnInit() {
    this.logfile = this.data.logfile;
  }

  /**
   * Callback when the Score button is clicked.
   * Modifies the logfile in the Server.
   */
  public score(): void {

    // Verify the score.
    this.scoreForm.updateValueAndValidity();
    if (this.scoreForm.value === null || this.scoreForm.invalid) {
      return;
    }

    this.busy = true;
    this.scoreForm.disable();

    const data = {
      status: 1,
      score: this.scoreForm.value
    };

    this.logfileService.modify(this.logfile.id, data).subscribe(
      (response) => {
        this.dialogRef.close(response);
        this.snackBar.open(
          `Logfile scored successfully`,
          'Got it',
          { duration: 2750 });
      },
      (error) => {
        this.busy = false;
        this.scoreForm.enable();
        this.snackBar.open(error.message, 'Got it');
      });
  }

  /**
   * Cancel the dialog.
   */
  public cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Show the error in the input form.
   */
  public getError(): string {
    // Empty score input.
    if (this.scoreForm.hasError('required')) {
      return 'A score is required.';
    }

    // No error.
    return '';
  }
}
