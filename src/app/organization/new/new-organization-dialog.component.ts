import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormBuilder, FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { ErrMsg } from '../../server/err-msg';
import { Organization } from '../organization';
import { OrganizationService } from '../organization.service';

@Component({
  selector: 'gz-new-organization-dialog',
  templateUrl: 'new-organization-dialog.component.html',
  styleUrls: ['new-organization-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    ReactiveFormsModule,
  ],
})

/**
 * The new Organization dialog component is a dialog window that lets user create an organization
 * step by step.
 */
export class NewOrganizationDialogComponent implements OnInit, OnDestroy {

  /**
   * Form control for the Organization name.
   * Only alphanumeric characters, dashes, underscores and spaces are accepted. It uses the same
   * regexp pattern as the Server. Also, length must be 3 characters or more.
   */
  public organizationName = new FormControl('', {validators: [Validators.required,
    Validators.pattern('^[\\w\\-\\s]+$'), Validators.minLength(3)], updateOn: 'change' });

  /**
   * Subscription to the changes of the organizationName.
   */
  public nameValueChanges: Subscription;

  /**
   * Form control for the Organization's billing email address.
   * Billing email to be added soon.
   */
  // public organizationEmail = new FormControl('',
  //   {validators: [Validators.required, Validators.email]});

  /**
   * Form control for the list of invitations.
   * Invitation list to be added in the future.
   */
  // public invitationList = new FormControl('');

  /**
   * Radio group containing plan options.
   */
  public planOptions: string[] = [
    'Free: Unlimited public assets',
  ];

  /**
   * Future plan options to appear as disabled radio buttons.
   */
  public disabledPlanOptions: string[] = [
    'Team: Coming soon',
  ];

  /**
   * Form control for the Organization plan.
   */
  public organizationPlan = new FormControl(this.planOptions[0]);

  /**
   * The form group to create the new organization.
   */
  public newOrganizationForm: FormGroup;

  /**
   * @param authService Service used to update the user's organization list.
   * @param dialog Dialog Service allows interaction with dialogs.
   * @param formBuilder The Builder to create the form group.
   * @param organizationService Service required to use Organizations from the Server.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public formBuilder: FormBuilder,
    public organizationService: OrganizationService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    // Creates the New Organization Form.
    this.newOrganizationForm = this.formBuilder.group({
      name: this.organizationName,
      // Billing email and invitation list to be added soon.
      // email: this.organizationEmail,
      // invitationList: this.invitationList,
      plan: this.organizationPlan
    });

    // Subscribe to value changes in the name.
    // Errors are shown when the input is 'touched', which happens when the input loses focus.
    // To show the error instantly, we mark it as touched when there is a change.
    this.nameValueChanges = this.organizationName.valueChanges.subscribe(
      (change) => {
        this.organizationName.markAsTouched();
      });
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Unsubscribe from any subscription.
   */
  public ngOnDestroy(): void {
    if (this.nameValueChanges) {
      this.nameValueChanges.unsubscribe();
    }
  }

  /**
   * Form submit callback to create the organization.
   */
  public onSubmit(): void {
    // Validate forms.
    // The 'required' validator doesn't trim the input values, so we verify they are correct before
    // submitting the form.

    // Check that the organization has a name.
    this.organizationName.setValue(this.organizationName.value.trim());
    this.organizationName.updateValueAndValidity();
    if (this.organizationName.invalid) {
      // TODO: Mark the step 1 as invalid.
      this.snackBar.open('Please provide an organization name.', 'Got it');
      return;
    }

    // Check that the organization has an email.
    // Billing email to be added soon.
    // this.organizationEmail.setValue(this.organizationEmail.value.trim());
    // this.organizationEmail.updateValueAndValidity();
    // if (this.organizationEmail.invalid) {
    //   // TODO: Mark the step 1 as invalid.
    //   this.snackBar.open('Please provide a valid billing email address.', 'Got it');
    //   return;
    // }

    // Create the data to be sent.
    const newOrg = {
      name: this.organizationName.value,
      // Billing email to be added soon. Meanwhile the User's email is used.
      // email: this.organizationEmail.value,
      email: this.authService.userProfile.email,
      // Invitation list to be added soon.
      // invitationList: this.invitationList.value,
      plan: this.organizationPlan.value,
    };

    this.organizationService.createOrganization(newOrg).subscribe(
      (response) => {
        // Update the Organization List.
        // TODO(german-mas): Consider moving this update into an AuthenticatedUser class.
        // See https://app.asana.com/0/719578238881157/756403371264694/f
        if (this.authService.userProfile.orgs) {
          this.authService.userProfile.orgs.push(response.name);
          this.authService.userProfile.orgRoles[response.name] = 'owner';
        } else {
          this.authService.userProfile.orgs = [response.name];
          this.authService.userProfile.orgRoles = {};
          this.authService.userProfile.orgRoles[response.name] = 'owner';
        }
        localStorage.setItem('profile', JSON.stringify(this.authService.userProfile));

        // Close the Dialog by ID.
        // Using the mat-dialog-close directive prevents the form from being submitted.
        const dialog = this.dialog.getDialogById('new-organization-dialog');
        if (dialog) {
          dialog.close();
        }
      },
      (error) => {
        if (error.code === ErrMsg.ErrorResourceExists) {
          this.snackBar.open(`An organization with the same name already exists`, 'Got it');
          this.organizationName.setErrors({ duplicated: true });
        } else {
          this.snackBar.open(`${error.message}`, 'Got it');
        }
      });
  }

  /**
   * Error message of the Organization Name input field.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  public getNameError(): string {
    // Empty organization name.
    if (this.organizationName.hasError('required')) {
      return 'An organization name is required';
    }

    // Duplicated organization name.
    if (this.organizationName.hasError('duplicated')) {
      return 'This organization already exists. Please use a different name';
    }

    // Pattern error in organization name.
    if (this.organizationName.hasError('pattern')) {
      return 'Only alphanumeric characters, spaces, dashes and underscores are accepted.';
    }

    // Length error in organization name.
    if (this.organizationName.hasError('minlength')) {
      return 'Name must have more than three characters.';
    }

    // No error.
    return '';
  }

  /**
   * Error message of the Organization Email input field.
   * Billing email to be added soon.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  // public getEmailError(): string {
  //   // Empty organization email.
  //   if (this.organizationEmail.hasError('required')) {
  //     return 'An email is required';
  //   }

  //   // Invalid email.
  //   if (this.organizationEmail.hasError('email')) {
  //     return 'Please enter a valid email address';
  //   }

  //   // No error.
  //   return '';
  // }
}
