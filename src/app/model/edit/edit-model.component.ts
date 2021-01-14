import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../auth/auth.service';
import { ModelService } from '../model.service';

import { Model } from '../model';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'ign-edit-model',
  templateUrl: 'edit-model.component.html',
  styleUrls: ['edit-model.component.scss']
})

/**
 * Edit Model Component is the page used to edit a model.
 */
export class EditModelComponent implements OnInit {

  /**
   * The model being edited. It is fetched using a Route Resolver.
   */
  public model: Model;

  /**
   * Flag that indicates whether the current user is authorized to edit the model.
   */
  public canEdit: boolean = false;

  /**
   * Whether categories have been modified or not. Notified by a CategoriesComponent event.
   */
  public categoriesModified: boolean = false;

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
  public allowedExtensions: string[] = Model.allowedExtensions;

  /**
   * Files uploaded using the FileUploadComponent.
   */
  public fileList: File[] = [];

  /**
   * Form control of the Description.
   */
  public editDescription = new FormControl();

  /**
   * Whether the model is being updated or not. Used to disable input elements.
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
   * @param modelService Service to request model deletion
   * @param router Router service to allow navigation.
   * @param snackBar Snackbar used to display notifications.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public dialog: MatDialog,
    public modelService: ModelService,
    public router: Router,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the model obtained from the Route Resolver and checks whether
   * the user is authorized to edit it.
   */
  public ngOnInit(): void {
    this.model = this.activatedRoute.snapshot.data['resolvedData'];

    this.canEdit = this.authService.canWriteResource(this.model);
  }

  /**
   * Callback to the CategoriesComponent's onModify event. Set the categories as 'dirty',
   * so they can be included in the form data to edit the model.
   *
   * @param categories The event that contains the modified categories.
   */
  public onModifyCategories(categories: string[]): void {
    this.categoriesModified = true;
    this.model.categories = categories;
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
    this.model.description = description;
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
      formData.append('description', this.model.description.trim());
    }

    // Check if the Tags have been modified.
    if (this.tagsModified) {
      formData.append('tags', this.model.tags.join());
    }

    // Check if the metadata has been modified.
    if (this.metadataModified) {
      // Add the model metadata. To delete/remove all metadata, send a single
      // {key: '', value: ''}. This feature should be handled automatically
      // by the metadata component.
      for (const m of this.model.metadata) {
        if (this.model.metadata.length === 1 ||
            (m.key !== '' && m.value !== '')) {
          formData.append('metadata', JSON.stringify(m));
        }
      }
    }

    // Check if the Categories have been modified.
    if (this.categoriesModified) {
      formData.append('categories', this.model.categories.join());
    }

    // Check if there are files to upload and analyze them.
    if (this.fileList.length > 0) {
      let hasConfig = false;
      let hasSDF = false;

      for (const file of this.fileList) {
        // Verify there is a model.config file
        // TODO(german-mas) Provide a class to handle Files and their extensions in a simpler way.
        // Avoid duplicated toLowerCase calls in Edit and New components.
        // File rename should be a method of this class, if necessary.
        // See: https://app.asana.com/0/660089940802243/729343249232870/f
        if (file.name === 'model.config') {
          hasConfig = true;
        }
        // Verify there is a SDF file.
        if (file.name.toLowerCase().indexOf('.sdf') > 0) {
          hasSDF = true;
        }
        formData.append('file', file, (file as any).fullPath);
      }

      if (!hasConfig) {
        this.snackBar.open(`Missing a 'model.config' file. It must be lowercase.`, 'Got it');
        return;
      }

      if (!hasSDF) {
        this.snackBar.open('Missing an SDF file.', 'Got it');
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

    this.modelService.edit(this.model.owner, this.model.name, formData)
      .pipe(
        finalize(() => {
          this.updating = false;
        })
      )
      .subscribe(
        (response) => {
          // Update the model.
          this.model = response;
          this.categoriesModified = false;
          this.tagsModified = false;
          this.metadataModified = false;
          this.descriptionModified = false;

          // Notify the user.
          this.snackBar.open(`${this.model.name} successfully updated`, 'Got it', {
            duration: 2750
          });

          // Go back to the model details.
          this.back();
        },
        (error) => {
          // The error code comes from ign-go and is specified by the fuelserver.
          if (error.code === 4002) {
            this.snackBar.open('Organization members cannot modify ' +
            'this model\'s permissions.', 'Got it');
          } else {
            this.snackBar.open(`${error.message}`, 'Got it');
          }
        });
  }

  /**
   * Callback when delete button is pressed
   */
  public onDelete(): void {

    const dialogOps = {
      data: {
        title: 'Delete model "' + this.model.name + '"',
        message: 'Be mindful when deleting a model, other users could be ' +
                 'counting on it. <br><b>Once deleted, the model can\'t be restored.</b>',
        buttonText: 'Delete',
        hasInput: true,
        inputMessage: 'To confirm, type the model name (case-sensitive)',
        inputPlaceholder: 'Model name',
        inputTarget: this.model.name
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
          this.modelService.delete(this.model)
              .subscribe(
                (response) => {
                  this.snackBar.open(this.model.name + ' model deleted', 'Got it', {
                    duration: 2750
                  });
                  this.router.navigate([this.model.owner + '/models']);
                },
                (error) => {
                  this.snackBar.open(`${error.message}`, 'Got it');
                });
              });
  }

  /**
   * Back to the current model's details page.
   */
  public back(): void {
    this.router.navigate([`${this.model.owner}/models/${this.model.name}`]);
  }
}
