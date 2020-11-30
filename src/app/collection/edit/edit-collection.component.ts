import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';

import { AuthService } from '../../auth/auth.service';
import { Collection, CollectionService } from '../../collection';

@Component({
  selector: 'ign-edit-collection',
  templateUrl: 'edit-collection.component.html',
  styleUrls: ['edit-collection.component.scss']
})

/**
 * Edit Collection Component is the page used to edit a collection.
 */
export class EditCollectionComponent implements OnInit {

  /**
   * The collection to edit.
   */
  public collection: Collection;

  /**
   * The file that will be uploaded as a banner or logo.
   */
  public bannerFile: File;

  /**
   * Whether description has been modified or not. Notified by a DescriptionComponent event.
   */
  public descriptionModified: boolean = false;

  /**
   * Whether the collection is being updated or not. Used to disable input elements.
   */
  public updating: boolean = false;

  /**
   * Indicates whether the current user has permission to edit this collection.
   */
  public canEdit: boolean = false;

  /**
   * Form Input for the Model Privacy.
   */
  private privacyInputForm = new FormControl();

  /**
   * Confirmation dialog reference for the deletion confirmation
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService Service to get authentication details
   * @param collectionService Service used to update the collection of the Server
   * @param router Router service to allow navigation.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public collectionService: CollectionService,
    public dialog: MatDialog,
    public router: Router,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the collection obtained from the Route Resolver and checks whether
   * the user is authorized to edit it.
   */
  public ngOnInit(): void {
    this.collection = this.activatedRoute.snapshot.data['resolvedData'];

    // Determine whether the logged user can edit this collection.
    // TODO(german-mas): Avoid duplicated code by having a "canEditResource" method in the User
    // Class, and using an Authenticated User.
    // See https://app.asana.com/0/719578238881157/756403371264694/f
    this.canEdit = this.authService.isAuthenticated() &&
      (this.collection.owner === this.authService.userProfile.username ||
      this.authService.userProfile['orgs'].includes(this.collection.owner));
  }

  /**
   * Callback when a file is selected.
   *
   * @param event The event fired by a change in the input field.
   */
  public onFileInput(event: Event): void {
    const file = event.target['files'][0];

    // Set the fullPath. Required for consistency between Chrome and Firefox browsers.
    // Appends /thumbnails, as it needs to be uploaded as one.
    if (file['webkitRelativePath'] === '') {
      file['fullPath'] = `/thumbnails/${file['name']}`;
    } else {
      file['fullPath'] = `/thumbnails/${file['webkitRelativePath']}`;
    }
    this.bannerFile = file;
  }

  /**
   * Callback to the DescriptionComponent's onModify event. Set the description as 'dirty'.
   *
   * @param description The event that contains the modified description.
   */
  public onModifyDescription(description: string): void {
    this.descriptionModified = true;
    this.collection.description = description;
  }

  /**
   * Callback when edit button is pressed.
   */
  public onEdit(): void {
    // Form data to send to the edit request.
    const formData = new FormData();

    // Check if Description has been modified.
    if (this.descriptionModified) {
      formData.append('description', this.collection.description.trim());
    }

    // Check if there are files to upload.
    if (this.bannerFile) {
      formData.append('file', this.bannerFile, this.bannerFile['fullPath']);
    }

    // Update the privacy and permissions.
    if (this.privacyInputForm.value !== null && this.privacyInputForm.value !== undefined) {
      const privacyBoolean = !!this.privacyInputForm.value;
      formData.append('private', privacyBoolean.toString());
    }

    this.updating = true;
    this.collectionService.editCollection(this.collection.owner, this.collection.name, formData)
      .subscribe(
        (response) => {
          this.snackBar.open(
            `${this.collection.name} has been successfully edited`,
            'Got it',
            { duration: 2750 });
          this.router.navigate([`${this.collection.owner}/collections/${this.collection.name}`]);
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        }
      );
  }

  /**
   * Callback when delete button is pressed
   */
  public onDelete(): void {
    const dialogOps = {
      data: {
        title: 'Delete collection "' + this.collection.name + '"',
        message: 'Be mindful when deleting a model, other users could be counting on it.',
        buttonText: 'Delete',
        hasInput: true,
        inputMessage: 'To confirm, type the collection\'s name (case-sensitive)',
        inputPlaceholder: 'Collection name',
        inputTarget: this.collection.name
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

          // Request deletion
          this.collectionService.deleteCollection(this.collection.owner, this.collection.name)
              .subscribe(
                (response) => {
                  this.snackBar.open(this.collection.name + ' collection deleted', 'Got it', {
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
   * Navigate back to the collection page.
   */
  public back(): void {
    this.router.navigate([`${this.collection.owner}/collections/${this.collection.name}`]);
  }

}
