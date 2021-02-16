import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder,
         FormControl,
         FormGroup,
         FormGroupDirective,
         Validators  } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { NewOrganizationDialogComponent, OrganizationService, Organization } from '../organization';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import {
  ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { AccessToken } from './access-token';
import { AccessTokenDialogComponent } from './access-token-dialog.component';
import { PaginatedAccessToken } from './paginated-access-token';

@Component({
  selector: 'ign-settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss']
})

/**
 * Settings Component is the page that lets users view, change and modify their account
 * related information.
 * - The Organization tab lists the Users organizations. A user can either create a new organization
 * or leave one.
 * - The Labs tab includes experimental features and let users enable them.
 */
export class SettingsComponent implements OnInit {

  /**
   * Experimental Feature: GzWeb.
   */
  public experimentalGzWeb: boolean = false;

  /**
   * In development: Notifications
   */
  public notifications: boolean = false;

  /**
   * List of Organizations.
   */
  public organizationList: string[] = [];

  /**
   * Form control used to select the tab indicated by the URL fragment.
   */
  public selected = new FormControl(0);

  /**
   * Create access token form
   */
  public createAccessTokenForm =  new FormGroup({
    tokenNameInputForm: new FormControl('',
      {validators: [Validators.required, Validators.pattern('^[a-zA-Z0-9 ]*$'),
                    Validators.minLength(3)],
      updateOn: 'change' || 'submit'}),
  });

  /**
   * Access token table columns.
   */
  public activeAccessTokensColumns: string[] = [];

  /**
   * The access tokens displayed in the data table.
   */
  public activeAccessTokens: MatTableDataSource<AccessToken>;

  /**
   * The paginated access tokens.
   */
  public paginatedAccessTokens = new PaginatedAccessToken();

  /**
   * The paginator for the access tokens.
   */
  @ViewChild(MatPaginator) public accessTokenPaginator: MatPaginator;

  /**
   * The access token form group.
   */
  @ViewChild(FormGroupDirective) public createAccessTokenFormDirective: FormGroupDirective;

  /**
   * Confirmation dialog reference.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param authService Service used to access the information of the authenticated user.
   * @param dialog Used to open and display other dialogs.
   * @param organizationService Service required to use Organizations from the Server.
   * @param profileService Service used to handle User related requests.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public organizationService: OrganizationService,
    public userService: UserService,
    public snackBar: MatSnackBar,
    private route: ActivatedRoute) {

  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    this.experimentalGzWeb = (localStorage.getItem('experimental_gzweb') === 'true');
    this.notifications = (localStorage.getItem('notifications') === 'true');
    if (this.authService.userProfile.orgs) {
      this.organizationList = this.authService.userProfile.orgs.sort();
    }

    /* Select the tab indicated by the URL fragment. */
    this.route.fragment.subscribe((fragment) => {
      if (fragment === 'account') {
        this.selected.setValue(0);
      } else if (fragment === 'access_tokens') {
        this.selected.setValue(1);
      } else if (fragment === 'organizations') {
        this.selected.setValue(2);
      } else if (fragment === 'labs') {
        this.selected.setValue(3);
      }
      });
    if (window.screen.width <= 600) {
      this.activeAccessTokensColumns = ['name', 'revoke'];
    } else {
      this.activeAccessTokensColumns = ['name', 'created', 'lastUsed', 'prefix', 'revoke'];
    }
    this.getAccessTokens();
  }

  /**
   * Callback for changes on the GzWeb experimental feature slider.
   */
  public onToggleGzWebFeature(event: MatSlideToggleChange): void {
    localStorage.setItem('experimental_gzweb', event.checked.toString());
  }

  public onToggleNotifications(event: MatSlideToggleChange): void {
    localStorage.setItem('notifications', event.checked.toString());
  }

  /**
   * Open the New Organization Dialog.
   */
  public newOrganizationDialog(): void {
    this.dialog.open(NewOrganizationDialogComponent, {id: 'new-organization-dialog',
      panelClass: 'ign-modal-panel'});
  }

  /**
   * Modal dialog to alert the user about leaving an organization.
   *
   * @param orgName The name of the organization.
   */
  public promptOrgLeave(orgName: string): void {

    const dialogOps = {
      data: {
        title: 'Leaving an Organization',
        message: `You are about to leave the ${orgName} organization. Are you sure?`,
        buttonText: 'Leave'
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Check for the result of the dialog. Leave the organization when the user accepts.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result === true) {
            const org = new Organization({name: orgName});
            const username = this.authService.userProfile.username;
            this.organizationService.removeUserFromOrganization(org, username).subscribe(
              (response) => {
                // Update the user profile.
                // TODO(german-mas): Consider moving this update into an AuthenticatedUser class.
                // See https://app.asana.com/0/719578238881157/756403371264694/f
                const index = this.authService.userProfile.orgs.indexOf(orgName);
                this.authService.userProfile.orgs.splice(index, 1);
                delete this.authService.userProfile.orgRoles[orgName];
                localStorage.setItem('profile', JSON.stringify(this.authService.userProfile));
              },
              (error) => {
                this.snackBar.open(`${error.message}`, 'Got it');
              }
            );
          }
      });
  }

  /**
   * Open the modal dialog to alert the user about deleting their account.
   */
  public confirmationDeleteAccount(): void {

    // Options of the Confirmation Dialog.
    const dialogOps = {
      data: {
        title: 'Delete account',
        message: `Are you sure you want to delete your account? <b>This can't be undone.</b>`,
        buttonText: 'Delete',
        hasInput: true,
        inputMessage: 'To confirm, please enter your username.',
        inputPlaceholder: 'User name',
        inputTarget: this.authService.userProfile.username
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Check for the result of the dialog. Delete the account if the user accepts.
    this.confirmationDialog.afterClosed().subscribe(
      (result) => {
        if (result === true) {
          this.userService.deleteUser(this.authService.userProfile.username).subscribe(
            (response) => {
              this.authService.logout();
              this.snackBar.open('Account deleted', 'Got it', { duration: 2750 });
            },
            (error) => {
              this.snackBar.open(error.message, 'Got it', { duration: 2750 });
            });
        }
      });
  }

  /**
   * Get all the access tokens.
   */
  public getAccessTokens(page?: number): void {
    this.userService.getAccessTokens(this.authService.userProfile.username, page).subscribe(
      (response) => {
        this.paginatedAccessTokens = response;
        this.activeAccessTokens = new MatTableDataSource(response.accessTokens);
      },
      (error) => {
        this.snackBar.open(error.message, 'Go it');
      }
    );
  }

  /**
   * Remove an access token.
   */
  public revokeAccessToken(token: AccessToken): void {

    const dialogOps = {
      data: {
        title: 'Are you sure you want to delete this token?',
        message: 'Any applications or scripts using this token will no longer be able to access ' +
        'the Ignition API. You cannot undo this action.',
        buttonText: 'Delete',
        hasInput: false,
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result !== true) {
            return;
          }
          this.userService.revokeAccessToken(this.authService.userProfile.username, token)
          .subscribe(
            () => {
              // Go to the previous page when removing the last token on the current page.
              if (this.paginatedAccessTokens.accessTokens.length <= 1) {
                this.accessTokenPaginator.previousPage();
              }

              // Get the remaining access tokens.
              this.getAccessTokens(this.accessTokenPaginator.pageIndex + 1);
            });
          }
      );
  }

  /**
   * Create a new access token.
   */
  public createAccessToken(): void {
    const name = this.createAccessTokenForm.get('tokenNameInputForm').value.trim();

    // Clear the form.
    this.createAccessTokenFormDirective.resetForm();

    // Call the service to create a new access token.
    this.userService.createAccessToken(this.authService.userProfile.username, name).subscribe(
      (result) => {
        const dialogOps = {
          data: {
            key: `${result.prefix}.${result.key}`
          }
        };

        // Show the new token.
        this.dialog.open(AccessTokenDialogComponent, dialogOps);
        this.getAccessTokens();

      },
      (error) => {
        this.snackBar.open(error.message, 'Go it');
      }
    );
  }

  /**
   * Callback of the access tokens paginator element, in order to get more access tokens.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public accessTokensPageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;
    this.getAccessTokens(page);
  }
}
