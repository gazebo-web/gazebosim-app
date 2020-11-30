import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../auth/auth.service';
import { LogfileService } from '../logfile.service';
import { Organization } from '../../organization';

@Component({
  selector: 'ign-new-logfile-dialog',
  templateUrl: 'new-logfile-dialog.component.html',
  styleUrls: ['new-logfile-dialog.component.scss']
})

/**
 * The dialog component used to upload a new logfile. It is a dialog, so the user doesn't loses
 * the context of the Portal competition.
 */
export class NewLogfileDialogComponent implements OnInit {

  /**
   * The logfile size limit in bytes.
   */
  public static readonly sizeLimit: number = 800 * 1024 * 1024;

  /**
   * List of potential owners the logfile could have. Lists only the participants of the
   * competition that the user has access to.
   * TODO(german-mas): We assume there is only one participant organization per user.
   */
  public ownerList: Organization[] = [];

  /**
   * Index of the selected owner from the list.
   * TODO(german-mas): We assume there is only one participant organization per user.
   */
  public owner: number = 0;

  /**
   * The logfile that will be uploaded.
   */
  public logfile: File;

  /**
   * Whether the logfile size is valid for upload.
   */
  public isLogfileValid: boolean = false;

  /**
   * Whether the logfile is being uploaded or not-
   */
  public uploading: boolean = false;

  /**
   * @param authService Service used to get information about the logged user.
   * @param data Data for the dialog. Fields:
   *        - portal (Portal) The portal to get data from.
   * @param dialogRef Reference to the opened dialog.
   * @param logfileService Service used to interact with Logfiles from the Server.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    public authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NewLogfileDialogComponent>,
    public logfileService: LogfileService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * Fills the list of potential owners.
   */
  public ngOnInit(): void {
    this.ownerList = this.data.portal.participants;
  }

  /**
   * Callback when a new file is uploaded.
   *
   * @param event The event where the new file is.
   */
  public onFileInput(event: Event): void {
    // Only one logfile can be uploaded at a time.
    const file: File = event.target['files'][0];
    // Set the fullPath. Required for consistency between Chrome and Firefox browsers.
    if (file['webkitRelativePath'] === '') {
      file['fullPath'] = file['name'];
    } else {
      file['fullPath'] = file['webkitRelativePath'];
    }

    this.logfile = file;
    this.isLogfileValid = this.logfile.size < NewLogfileDialogComponent.sizeLimit;
  }

  /**
   * Callback when the Upload button is clicked.
   * Upload the logfile into the Server.
   */
  public upload(): void {

    // Prepare the form.
    const formData = new FormData();
    // TODO(german-mas): We assume there is only one participant organization per user.
    formData.append('owner', this.ownerList[this.owner].name);
    formData.append('private', 'true');
    formData.append('file', this.logfile, (this.logfile as any).fullPath);

    this.uploading = true;

    this.logfileService.upload(formData).subscribe(
      (response) => {
        this.dialogRef.close(response);
        this.snackBar.open(
          `Logfile uploaded successfully`,
          'Got it',
          { duration: 2750 });
      },
      (error) => {
        this.uploading = false;
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Cancel the dialog.
   */
  public cancel(): void {
    this.dialogRef.close();
  }
}
