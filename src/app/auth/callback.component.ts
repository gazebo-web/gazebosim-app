import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from './auth.service';
import { ErrMsg } from '../server/err-msg';
import { UserService } from '../user/user.service';

@Component({
  templateUrl: 'callback.component.html',
  styleUrls: ['callback.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})

/**
 * The Auth Callback Component is the endpoint that handles the view of the auth callback,
 * after the user is logged in.
 * Allows the user to log in or create their account in case they don't have one.
 */
export class AuthCallbackComponent implements OnInit, OnDestroy {

  /**
   * Input field for the username.
   */
  public username = new FormControl('', { validators: [Validators.required,
    Validators.minLength(3), Validators.pattern('[a-zA-Z0-9]+')], updateOn: 'change' || 'submit'});

  /**
   * Check whether the user is logged in or not.
   */
  public loggedIn: boolean;

  /**
   * Check whether the user needs to create an account.
   */
  public needAccount: boolean;

  /**
   * Check whether the user needs to validate their email.
   */
  public needValidation: boolean;

  /**
   * Check whether the validation has succeeded.
   */
  public validationSuccess: boolean;

  /**
   * Subscriber to the Logged In status.
   */
  public loggedInSubscriber: Subscription;

  /**
   * @param activatedRoute The currently active route to get query parameters.
   * @param authService Service to handle the authentication.
   * @param router Router used to navigate.
   * @param snackbar Snackbar used to show notifications.
   * @param userService Service used to handle Server users.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    public snackBar: MatSnackBar,
    private userService: UserService) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Subscribes to the loggedIn$ behavior subject, which triggers whenever a user logs in or out.
   */
  public ngOnInit(): void {

    // Determine from the route if the user needs to validate their email.
    this.needValidation = this.activatedRoute.snapshot.queryParams.validate;

    // Determine from the route if the email has been correctly validated.
    this.validationSuccess = this.activatedRoute.snapshot.queryParams.success;

    // Subscribe to the AuthService's loggedIn behavior subject.
    // A subscription is required, because the Authentication process is asynchronous.
    // See also auth.service.ts::setLoggedIn()
    this.loggedInSubscriber = this.authService.loggedIn$.subscribe((logged: boolean) => {

      this.loggedIn = logged;

      // Once it's logged in, check if the user is registered.
      if (logged) {

        // Try to get the username associated with the current token.
        this.userService.getLogin().subscribe(
          // On Success
          (res) => {
            // Append username and orgs to the stored Profile.
            // TODO(german-mas): Consider moving this update into an AuthenticatedUser class.
            // See https://app.asana.com/0/719578238881157/756403371264694/f
            const profile = JSON.parse(localStorage.getItem('profile'));
            profile.username = res.username;
            profile.orgs = res.organizations;
            profile.orgRoles = res.orgRoles;
            if (res.sysAdmin) {
              profile.sysAdmin = res.sysAdmin;
            }
            localStorage.setItem('profile', JSON.stringify(profile));
            this.authService.userProfile = profile;
            this.router.navigate(['/home']);
          },
          // On Error
          (error) => {
            // No user in server with the claimed identity.
            if (error.code === ErrMsg.ErrorAuthNoUser) {
              this.needAccount = true;
            } else {
              this.snackBar.open(error.message, 'Got it');
            }
          }
        );
      }
    });
  }

  /**
   * OnDestroy lifecycle hook.
   *
   * Unsubscribes from the loggedIn$ behavior subject.
   */
  public ngOnDestroy(): void {
    if (this.loggedInSubscriber) {
      this.loggedInSubscriber.unsubscribe();
    }
  }

  /**
   * Create an Account.
   */
  public createAccount(): void {

    // The required validator doesn't trim the value of the input.
    this.username.setValue(this.username.value.trim());
    this.username.updateValueAndValidity();

    // Check that a username has been specified.
    if (this.username.value === undefined || this.username.value === '') {
      return;
    }

    if (this.username.invalid) {
      return;
    }

    const body = {
      username: this.username.value,
      name: this.authService.userProfile.name,
      email: this.authService.userProfile.email,
    };

    // Create the account.
    this.userService.createUser(body).subscribe(
      // On success
      (res) => {
        // On a successful creation, update the Profile stored.
        // TODO(german-mas): Consider moving the profile update method into a an
        // AuthenticatedUser class.
        // See https://app.asana.com/0/719578238881157/756403371264694/f
        // Update Local Storage Profile.
        const profile = JSON.parse(localStorage.getItem('profile'));
        profile.username = res.username;
        profile.orgs = res.organizations;
        profile.orgRoles = res.orgRoles;
        if (res.sysAdmin) {
          profile.sysAdmin = res.sysAdmin;
        }
        this.authService.userProfile = profile;
        localStorage.setItem('profile', JSON.stringify(profile));
        this.router.navigate(['/home']);
      },

      // On error
      (error) => {
        // A resource with the same ID already exists.
        if (error.code === ErrMsg.ErrorResourceExists) {
          // Set the error in the Input Form.
          this.username.setErrors({
            usernameTaken: true
          });
        } else {
          this.snackBar.open(error.message, 'Got it');
        }
      });
  }

  /**
   * Error message of the input field.
   *
   * @returns The error message associated to an error in the form, or an empty string if
   * there is no error.
   */
  public getErrorMessage(): string {
    // Empty username.
    if (this.username.hasError('required')) {
      return 'You must enter a value';
    }

    // Username too short.
    if (this.username.hasError('minlength')) {
      return 'Username must have more than 3 characters.';
    }

    // Username has invalid characters.
    if (this.username.hasError('pattern')) {
      return 'Use only alphanumeric characters.';
    }

    // Username already taken.
    if (this.username.hasError('usernameTaken')) {
      return 'Username already taken.';
    }

    // No error.
    return '';
  }
}
