import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';

import { AuthService } from '../auth/auth.service';
import { Collection } from './collection';
import { CollectionService } from './collection.service';
import { ModelService } from '../model/model.service';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { WorldService } from '../world/world.service';
import {
  ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { CopyDialogComponent } from '../fuel-resource/copy-dialog/copy-dialog.component';

@Component({
  selector: 'ign-collection',
  templateUrl: 'collection.component.html',
  styleUrls: ['collection.component.scss']
})

/**
 * Collection Component is the page that display the details of a single collection.
 */
export class CollectionComponent implements OnInit {

  /**
   * The collection represented by this page.
   */
  public collection: Collection;

  /**
   * The paginated models returned from the Server.
   */
  public paginatedModels: PaginatedModels;

  /**
   * The paginated worlds returned from the Server.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * Indicates whether the current user has permission to edit this collection.
   */
  public canEdit: boolean = false;

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'models' | 'worlds' = 'models';

  /**
   * Confirmation dialog reference used to confirm when a collection is removed.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * Dialog to prompt the user about the collection name and owner for copying.
   */
  private copyNameDialog: MatDialogRef<CopyDialogComponent>;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService The Authentication Service to determine the user's permissions
   * @param collectionService Service used to handle collection-related requests to the Server.
   * @param dialog Enables the Material Dialog.
   * @param modelService Service used to fetch the organization's models.
   * @param router The router allows page navigation.
   * @param snackBar Snackbar used to display notifications.
   * @param worldService Service used to fetch the organization's worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private collectionService: CollectionService,
    public dialog: MatDialog,
    private modelService: ModelService,
    public router: Router,
    public snackBar: MatSnackBar,
    private worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {

    // Retrieve the collection from the activated route's data.
    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.collection = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Get the collection's models.
    this.collectionService.getCollectionModels(this.collection.owner, this.collection.name)
      .subscribe(
        (response) => {
          this.paginatedModels = response;
          this.collection.models = response.resources;
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });

    // Get the collection's worlds.
    this.collectionService.getCollectionWorlds(this.collection.owner, this.collection.name)
      .subscribe(
        (response) => {
          this.paginatedWorlds = response;
          this.collection.worlds = response.resources;
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });

    // Determine whether the logged user can edit this collection.
    // TODO(german-mas): Avoid duplicated code by having a "canEditResource" method in the User
    // Class, and using an Authenticated User.
    // See https://app.asana.com/0/719578238881157/756403371264694/f
    this.canEdit = this.authService.isAuthenticated() &&
      (this.collection.owner === this.authService.userProfile.username ||
      this.authService.userProfile['orgs'].includes(this.collection.owner));
  }

  /**
   * Remove collection.
   */
  public removeCollection(): void {
    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Delete collection ${this.collection.name}`,
        message: `<p>Are you sure you want to remove this collection?</p>\
                 <p>Assets that belong to this collection won't be affected.</p>\
                 <p><strong>Once deleted, the collection can't be restored.</strong></p>`,
        buttonText: 'Delete',
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

          // Request deletion.
          this.collectionService.deleteCollection(this.collection.owner, this.collection.name)
            .subscribe(
              (response) => {
                this.snackBar.open(`${this.collection.name} was removed`, 'Got it', {
                  duration: 2750
                });
                this.router.navigate([this.collection.owner + '/collections']);
              },
              (error) => {
                this.snackBar.open(`${error.message}`, 'Got it');
              });
        });
  }

  /**
   * Loads the next page of models.
   */
  public loadNextModelsPage(): void {
    if (this.paginatedModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedModels).subscribe(
        (paginatedModels) => {
          this.paginatedModels = paginatedModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.collection.models.slice();
          for (const model of paginatedModels.resources) {
            newModels.push(model);
          }
          this.collection.models = newModels;
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
        (paginatedWorlds) => {
          this.paginatedWorlds = paginatedWorlds;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.collection.worlds.slice();
          for (const world of paginatedWorlds.resources) {
            newWorlds.push(world);
          }
          this.collection.worlds = newWorlds;
        }
      );
    }
  }

  /**
   * Event callback to remove a resource from the Collection.
   *
   * @param event The event containing the resource to remove.
   */
  public removeItem(event) {
    const resource = event.resource;

    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Remove ${resource.name} from Collection`,
        message: `<p>Are you sure you want to remove ${resource.name} from this collection?</p>\
                  <p>Keep in mind this won't delete the resource, only remove it from the\
                  <strong>${this.collection.name}</strong> collection.</p>`,
        buttonText: 'Remove',
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

          // Request deletion.
          this.collectionService.removeAsset(this.collection.owner, this.collection.name, resource)
          .subscribe(
            (response) => {
              // Determine from which list to remove the resource and update the counter.
              let resourceList;
              if (event.type === 'models') {
                resourceList = this.collection.models;
                this.paginatedModels.totalCount--;
              }
              if (event.type === 'worlds') {
                resourceList = this.collection.worlds;
                this.paginatedWorlds.totalCount--;
              }

              const index = resourceList.indexOf(resource);
              resourceList.splice(index, 1);
              this.snackBar.open(`${resource.name} was removed from ${this.collection.name}`,
                'Got it',
                { duration: 2750 });
            },
            (error) => {
              this.snackBar.open(`${error.message}`, 'Got it');
            });
        });
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
    }
  }

  /**
   * Title of the Copy Button.
   *
   * @returns The title of the copy button, whether the collection can be copied or not.
   */
  private getCopyButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Log in to copy this collection';
    }
    return 'Copy this collection';
  }

  /**
   * Callback for the Collection Copy button.
   */
  private copyCollection(): void {
    const dialogOps = {
      disableClose: true,
      data: {
        title: 'Copy collection',
        message: `<p>Add a copy of the collection to your account or into an organization.</p>
          <p>Please enter a new name and owner for the copied collection.</p>`,
        name: this.collection.name,
        namePlaceholder: 'Collection name',
        owner: this.authService.userProfile.username,
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        busyMessage: `<p>Copying the collection into the account.</p>`,
      }
    };

    this.copyNameDialog = this.dialog.open(CopyDialogComponent, dialogOps);

    // Subscribe to the dialog's submit method.
    this.copyNameDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        if (result !== undefined && result.copyName.trim() !== '') {
          this.copyNameDialog.componentInstance.busy = true;
          this.collectionService.copy(this.collection, result.copyName.trim(), result.copyOwner)
            .subscribe(
              (response) => {
                this.copyNameDialog.close();

                this.snackBar.open(`${response.name} was created`, 'Got it', { duration: 2750 });
                this.router.navigate([`/${response.owner}/collections/${response.name}`]);
              },
              (error) => {
                this.snackBar.open(error.message, 'Got it');
              });
        } else {
          this.copyNameDialog.componentInstance.busy = false;
        }
      });
  }
}
