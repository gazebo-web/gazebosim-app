import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../auth/auth.service';
import { CollectionService, Collection, PaginatedCollection } from '../collection';
import {
  ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { Organization } from './organization';
import { OrganizationService } from './organization.service';
import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';

@Component({
  selector: 'ign-organization',
  templateUrl: 'organization.component.html',
  styleUrls: ['organization.component.scss']
})

/**
 * Organization Component displays the information regarding an organization.
 */
export class OrganizationComponent implements OnInit {

  /**
   * The organization being displayed by the component. Comes from the Organization Resolver.
   */
  public organization: Organization;

  /**
   * The list of organization roles.
   * The HTML layout can't access Organization.roles directly.
   */
  public roles: string[] = Organization.roles;

  /**
   * The list of models of the organization.
   */
  public models: Model[];

  /**
   * The paginated Models returned from the Server.
   */
  public paginatedModels: PaginatedModels;

  /**
   * The list of worlds of the organization.
   */
  public worlds: World[];

  /**
   * The paginated Worlds returned from the Server.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * The list of collections of the organization.
   */
  public collections: Collection[];

  /**
   * The paginated Collections returned from the Server.
   */
  public paginatedCollections: PaginatedCollection;

  /**
   * The list of users of the organization.
   */
  public users: any[];

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'models' | 'worlds' | 'users' | 'collections' = 'models';

  /**
   * Form field for the Username input.
   */
  public usernameInputForm = new FormControl('', {validators: [Validators.required],
    updateOn: 'change' || 'submit'});

  /**
   * Form field for the role select dropdown.
   */
  public roleDropdownForm = new FormControl('', {validators: [Validators.required],
    updateOn: 'change' || 'submit'});

  /**
   * Confirmation dialog reference.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param authService Service used to get the logged in user's profile.
   * @param collectionService Service used to fetch the organization's collections.
   * @param dialog Used to open and display other dialogs.
   * @param modelService Service used to fetch the organization's models.
   * @param organizationService Service required to use Organizations from the Server.
   * @param snackBar Snackbar used to display notifications.
   * @param worldService Service used to fetch the organization's worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public collectionService: CollectionService,
    public dialog: MatDialog,
    public modelService: ModelService,
    public organizationService: OrganizationService,
    public snackBar: MatSnackBar,
    public worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {

    // Get the Organization from the resolved data.
    this.organization = this.activatedRoute.snapshot.data['resolvedData'];

    // Get the Organization's models.
    this.modelService.getOwnerList(this.organization.name).subscribe(
      (response) => {
        this.paginatedModels = response;
        this.models = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the Organization's worlds.
    this.worldService.getOwnerList(this.organization.name).subscribe(
      (response) => {
        this.paginatedWorlds = response;
        this.worlds = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the Organization's collections.
    this.collectionService.getOwnerCollectionList(this.organization.name).subscribe(
      (response) => {
        this.paginatedCollections = response;
        this.collections = response.collections;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the Organization's users.
    this.organizationService.getOrganizationUsers(this.organization).subscribe(
      (response) => {
        this.users = response;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Loads the next page of models.
   */
  public loadNextModelsPage(): void {
    if (this.paginatedModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedModels).subscribe(
        (pagModels) => {
          this.paginatedModels = pagModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.models.slice();
          for (const model of pagModels.resources) {
            newModels.push(model);
          }
          this.models = newModels;
        }
      );
    }
  }

  /**
   * Loads the next page of worlds.
   */
  public loadNextWorldsPage(): void {
    if (this.paginatedWorlds.hasNextPage()) {
      this.worldService.getNextPage(this.paginatedWorlds).subscribe(
        (pagWorlds) => {
          this.paginatedWorlds = pagWorlds;
          // Copy and extend the existing array of worlds with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.worlds.slice();
          for (const world of pagWorlds.resources) {
            newWorlds.push(world);
          }
          this.worlds = newWorlds;
        }
      );
    }
  }

  /**
   * Loads the next page of collections.
   */
  public loadNextCollectionsPage(): void {
    if (this.paginatedCollections.hasNextPage()) {
      this.collectionService.getNextPage(this.paginatedCollections).subscribe(
        (pagCollections) => {
          this.paginatedCollections = pagCollections;
          // Copy and extend the existing array of collections with the new ones.
          // A copy is required in order to trigger changes.
          const newCollections = this.collections.slice();
          for (const col of pagCollections.collections) {
            newCollections.push(col);
          }
          this.collections = newCollections;
        }
      );
    }
  }

  /**
   * Add user to an organization.
   */
  public addUser(): void {
    // Verify the username.
    // Note: The 'required' validator doesn't trim the value.
    this.usernameInputForm.setValue(this.usernameInputForm.value.trim());
    this.usernameInputForm.updateValueAndValidity();
    if (this.usernameInputForm.value === undefined || this.usernameInputForm.value === '') {
      this.snackBar.open('Please provide a Fuel username.', 'Got it');
      return;
    }

    // Verify the role.
    this.roleDropdownForm.updateValueAndValidity();
    if (!this.roleDropdownForm.valid) {
      this.snackBar.open('Please select a role for the user.', 'Got it');
      return;
    }

    // Everything OK: Add the user.
    const name = this.usernameInputForm.value;
    const role = this.roleDropdownForm.value.toLowerCase();
    this.organizationService.addUserToOrganization(this.organization, name, role).subscribe(
      (response) => {
        response.orgRoles = {[this.organization.name]: role};
        this.users.push(response);
        // Sort by username.
        this.users.sort((userA, userB) => {
          const usernameA = userA.username.toUpperCase();
          const usernameB = userB.username.toUpperCase();
          if (usernameA < usernameB) {
            return -1;
          }
          if (usernameA > usernameB) {
            return 1;
          }
          return 0;
        });
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Modal dialog to alert about a user removal.
   *
   * @param user The user to remove from the organization.
   */
  public removeUser(user: any): void {

    const dialogOps = {
      data: {
        title: `Remove from Organization`,
        message: '',
        buttonText: ''
      }
    };

    // Check if the user to remove is the one logged in.
    if (user.username === this.authService.userProfile.username) {
      dialogOps.data.message = `You are about to leave the ${this.organization.name} ` +
        `organization. Are you sure?`;
      dialogOps.data.buttonText = `Leave`;
    } else {
      dialogOps.data.message = `You are about to remove the user ${user.username} from the ` +
        `${this.organization.name} organization. Are you sure?`;
      dialogOps.data.buttonText = `Remove`;
    }

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Check for the result of the dialog. Remove the username when the user accepts.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result === true) {
            this.organizationService.removeUserFromOrganization(this.organization, user.username)
            .subscribe(
              (response) => {
                // Remove the User from the list.
                this.users = this.users.filter((us) => {
                  return us.username !== response.username;
                });

                // If the removed user is the logged one, update their profile.
                if (response.username === this.authService.userProfile.username) {
                  const index = this.authService.userProfile.orgs.indexOf(this.organization.name);
                  this.authService.userProfile.orgs.splice(index, 1);
                  delete this.authService.userProfile.orgRoles[this.organization.name];
                  localStorage.setItem('profile', JSON.stringify(this.authService.userProfile));
                }
              },
              (error) => {
                this.snackBar.open(error.message, 'Got it');
              }
            );
          }
        });
  }

  /**
   * Whether to show or not the remove button.
   * The button can be seen when the logged user has write access to the Organization, or to allow
   * them to leave an Organization.
   *
   * This helps extracting template logic from the layout page.
   *
   * @param user The user the button refers to.
   * @returns A boolean whether the button should be shown or not.
   */
  public canDisplayRemoveButton(user: any): boolean {
    if (this.authService.userProfile) {
      return this.authService.userProfile.username === user.username ||
      this.authService.hasWriteAccess(this.organization.name);
    }
    return false;
  }

  /**
   * Determine whether the Remove button should be disabled for a user. Owners
   * of the organization can't be removed, so the button must be disabled.
   * This helps extracting template logic from the layout page.
   *
   * @param user The user required to check permissions.
   * @returns Whether the remove button should be disabled or not.
   */
  public disableRemoveButton(user: any): boolean {
    return user.orgRoles && user.orgRoles[this.organization.name] === 'owner';
  }

  /**
   * The tooltip of the remove button. Provides extra information of the user
   * can't be removed.
   * This helps extracting template logic from the layout page.
   *
   * @param user The user the button refers to.
   * @returns The tooltip to be displayed.
   */
  public getRemoveButtonTooltip(user: any): string {
    let tooltip = '';
    // Enabled buttons have no tooltip.
    if (this.disableRemoveButton(user)) {
      if (this.authService.userProfile.username === user.username) {
        tooltip = `You can't leave the organization.`;
      } else {
        tooltip = `This user can't be removed.`;
      }
    }
    return tooltip;
  }

  /**
   * The label of the remove button.
   * This helps extracting template logic from the layout page.
   *
   * @param user The user the button refers to.
   * @returns The label to use in the button.
   */
  public getRemoveButtonLabel(user: any): string {
    let label = '';
    if (this.authService.userProfile.username === user.username) {
      label = `Leave`;
    } else {
      label = `Remove`;
    }
    return label;
  }

  /**
   * Callback when the tab is changed. Determines the current active tab.
   */
  public setActiveTab(event: number): void {
    switch (event) {
      case 0: {
        this.activeTab = 'models';
        break;
      }
      case 1: {
        this.activeTab = 'worlds';
        break;
      }
      case 2: {
        this.activeTab = 'users';
        break;
      }
      case 3: {
        this.activeTab = 'collections';
        break;
      }
    }
  }
}
