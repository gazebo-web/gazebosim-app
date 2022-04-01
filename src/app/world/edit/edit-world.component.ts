import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { WorldService } from '../world.service';

import { World } from '../world';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'gz-edit-world',
  templateUrl: 'edit-world.component.html',
  styleUrls: ['edit-world.component.scss']
})

/**
 * Edit World Component is the page used to edit a world.
 */
export class EditWorldComponent implements OnInit {

  /**
   * The world being edited. It is fetched using a Route Resolver.
   */
  public world: World;

  /**
   * Flag that indicates whether the current user is authorized to edit the world.
   */
  public canEdit: boolean = false;

  /**
   * Whether tags have been modified or not. Notified by a TagsComponent event.
   */
  public tagsModified: boolean = false;

  /**
   * Whether metadata have been modified or not. Notified by a
   * MetadataComponent event.
   */
  public metadataModified: boolean = false;

  /**
   * Whether description has been modified or not. Notified by a DescriptionComponent event.
   */
  public descriptionModified: boolean = false;

  /**
   * Allowed extensions to be uploaded.
   */
  public allowedExtensions: string[] = World.allowedExtensions;

  /**
   * Files uploaded using the FileUploadComponent.
   */
  public fileList: File[] = [];

  /**
   * Form control of the Description.
   */
  public editDescription = new FormControl();

  /**
   * Whether the world is being updated or not. Used to disable input elements.
   */
  public updating: boolean = false;

  /**
   * Form Input for the Model Privacy.
   */
  public privacyInputForm = new FormControl();

  /**
   * Confirmation dialog reference for the deletion confirmation
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService Service to get authentication details
   * @param dialog Enables the Material Dialog.
   * @param worldService Service to request world deletion
   * @param router Router service to allow navigation.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public dialog: MatDialog,
    public worldService: WorldService,
    public router: Router,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the world obtained from the Route Resolver and checks whether
   * the user is authorized to edit it.
   */
  public ngOnInit(): void {
    this.world = this.activatedRoute.snapshot.data['resolvedData'];

    this.canEdit = this.authService.canWriteResource(this.world);
  }

  /**
   * Callback to the TagsComponent's onModify event. Set the tags as 'dirty'.
   */
  public onModifyTags(): void {
    this.tagsModified = true;
  }

  /**
   * Callback to the MetadataComponent's onModify event.
   * Set the metadata as 'dirty'.
   */
  public onModifyMetadata(): void {
    this.metadataModified = true;
  }

  /**
   * Callback to the DescriptionComponent's onModify event. Set the description as 'dirty'.
   *
   * @param description The event that contains the modified description.
   */
  public onModifyDescription(description: string): void {
    this.descriptionModified = true;
    this.world.description = description;
  }

  /**
   * Callback to the FileUploadComponent's files event. Keeps track of the uploaded files.
   */
  public onReceiveFiles(event: File[]): void {
    this.fileList = event;
  }

  /**
   * Callback when edit button is pressed.
   */
  public onEdit(): void {
    // Form data to send to the edit request.
    const formData = new FormData();

    // Check if Description has been modified.
    if (this.descriptionModified) {
      formData.append('description', this.world.description.trim());
    }

    // Check if the Tags have been modified.
    if (this.tagsModified) {
      formData.append('tags', this.world.tags.join());
    }

    // Check if the metadata has been modified.
    if (this.metadataModified) {
      // Add the world metadata. To delete/remove all metadata, send a single
      // {key: '', value: ''}. This feature should be handled automatically
      // by the metadata component.
      for (const m of this.world.metadata) {
        if (this.world.metadata.length === 1 ||
            (m.key !== '' && m.value !== '')) {
          formData.append('metadata', JSON.stringify(m));
        }
      }
    }

    // Check if there are files to upload and analyze them.
    if (this.fileList.length > 0) {
      let hasRequiredFile = false;

      for (const file of this.fileList) {
        // Verify there is a file with the .world or .sdf extensions.
        // TODO(german-mas) Provide a class to handle Files and their extensions in a simpler way.
        // Avoid duplicated toLowerCase calls in Edit and New components.
        // See: https://app.asana.com/0/660089940802243/729343249232870/f
        const filename = file.name.toLowerCase();
        if (filename.indexOf('.world') > 0 || filename.indexOf('.sdf') > 0) {
          hasRequiredFile = true;
        }
        formData.append('file', file, (file as any).fullPath);
      }

      if (!hasRequiredFile) {
        this.snackBar.open('Missing a world file or a sdf file.', 'Got it');
        return;
      }
    }

    // Disable the input fields until we have a response.
    this.updating = true;

    // Update the privacy and permissions.
    if (this.privacyInputForm.value !== null && this.privacyInputForm.value !== undefined) {
      const privacyBoolean = !!this.privacyInputForm.value;
      formData.append('private', privacyBoolean.toString());
      formData.append('permission', this.privacyInputForm.value.toString());
    }

    this.worldService.edit(this.world.owner, this.world.name, formData)
      .pipe(
        finalize(() => {
          this.updating = false;
        })
      )
      .subscribe(
        (response) => {
          // Update the world.
          this.world = response;
          this.tagsModified = false;
          this.metadataModified = false;
          this.descriptionModified = false;

          // Notify the user.
          this.snackBar.open(`${this.world.name} successfully updated`, 'Got it', {
            duration: 2750
          });

          // Go back to the world details.
          this.back();
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        });
  }

  /**
   * Callback when delete button is pressed
   */
  public onDelete(): void {

    const dialogOps = {
      data: {
        title: 'Delete world "' + this.world.name + '"',
        message: 'Be mindful when deleting a world, other users could be ' +
                 'counting on it. <br><b>Once deleted, the world can\'t be restored.</b>',
        buttonText: 'Delete',
        hasInput: true,
        inputMessage: 'To confirm, type the world name (case-sensitive)',
        inputPlaceholder: 'World name',
        inputTarget: this.world.name
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
          this.worldService.delete(this.world)
              .subscribe(
                (response) => {
                  this.snackBar.open(this.world.name + ' world deleted', 'Got it', {
                    duration: 2750
                  });
                  this.router.navigate([this.world.owner + '/worlds']);
                },
                (error) => {
                  this.snackBar.open(`${error.message}`, 'Got it');
                });
              });
  }

  /**
   * Back to the current world's details page.
   */
  public back(): void {
    this.router.navigate([`${this.world.owner}/worlds/${this.world.name}`]);
  }
}
