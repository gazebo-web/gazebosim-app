import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AuthService } from '../../auth/auth.service';
import { Portal } from '../portal';

@Component({
  selector: 'ign-registration-dialog',
  templateUrl: 'registration-dialog.component.html',
  styleUrls: ['registration-dialog.component.scss']
})

/**
 * The registration dialog component is a dialog window that allows users to register into a
 * competition through a Portal.
 */
export class RegistrationDialogComponent implements OnInit {

  /**
   * Used to emit an event when the registration form is complete. The registration
   * should be handled by the component that opened this dialog.
   */
  @Output() public onRegister = new EventEmitter<any>();

  /**
   * Portal coming from the component that opens the dialog. It needs to be passed in the
   * dialog's data.
   */
  public portal: Portal;

  /**
   * Form control for the Organization to register.
   */
  public orgToRegister = new FormControl('', {validators: [Validators.required]});

  /**
   * List of organizations allowed to register.
   */
  public organizationList: string[];

  /**
   * @param authService Service used to get information about the logged user.
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *        - portal (Portal) The portal to get data from.
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialogRef<RegistrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    // Get all the Organizations the user can register.
    this.organizationList = this.authService.userProfile['orgs'].filter(
      (org) => this.authService.hasWriteAccess(org));

    this.portal = this.data.portal;
  }

  /**
   * Form submit callback. Register the given Organization into the competition of the Portal.
   */
  public register(): void {

    if (this.orgToRegister.errors) {
      return;
    }
    this.onRegister.emit(this.orgToRegister.value);
  }

  /**
   * Close the registration dialog.
   */
  public close(): void {
    this.dialog.close();
  }

  /**
   * Error message of the input field for the Organization to register.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  public getError(): string {
    // No organization provided.
    if (this.orgToRegister.hasError('required')) {
      return 'An organization is required to register';
    }

    // No error.
    return '';
  }
}
