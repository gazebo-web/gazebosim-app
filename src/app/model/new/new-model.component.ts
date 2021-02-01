import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { ErrMsg } from '../../server/err-msg';
import { Model } from '../model';
import { ModelService } from '../model.service';

@Component({
  selector: 'ign-new-model',
  templateUrl: 'new-model.component.html',
  styleUrls: ['new-model.component.scss']
})

/**
 * New Model Component is the page that allows users to upload models.
 */
export class NewModelComponent implements OnInit {

  /**
   * List of owners the model could have. Includes the logged in user and their organizations
   * (if they have the correct permissions).
   */
  public ownerList: string[] = [];

  /**
   * Index of the selected owner from the list. By default, it's the logged user.
   */
  public owner: number = 0;

  /**
   * Model human readable name.
   */
  public modelName: string;

  /**
   * Model name for the URL.
   */
  public urlName: string;

  /**
   * List of licenses.
   */
  public licenses: string[] = ['Creative Commons - Public Domain',
                               'Creative Commons - Attribution',
                               'Creative Commons - Attribution - Share Alike',
                               'Creative Commons - Attribution - No Derivatives',
                               'Creative Commons - Attribution - Non Commercial',
                               'Creative Commons - Attribution - Non Commercial - Share Alike',
                               'Creative Commons - Attribution - Non Commercial - No Derivatives',
                              ];

  /**
   * Allowed extensions to be uploaded.
   */
  public allowedExtensions: string[] = Model.allowedExtensions;

  /**
   * Selected license's index (CC-BY by default).
   */
  public license: number = 1;

  /**
   * List of tags.
   */
  public tags: string[] = [];

  /**
   * List of categories.
   */
  public categories: string[] = [];

  /**
   * Model description.
   */
  public description: string = '';

  /**
   * List of possible permissions.
   */
  public permissionList: string[] = ['Public', 'Private'];

  /**
   * Array of files.
   */
  public fileList: File[] = [];

  /**
   * Indicated whether already uploading the model.
   */
  public uploading: boolean = false;

  /**
   * The subscription to the Upload Observable from the New Model Service.
   */
  public uploadSubscriber: Subscription;

  /**
   * Form Input for the Model Name. Allows better error handling.
   */
  public modelNameInputForm = new FormControl('',
    {validators: [Validators.required, Validators.pattern('[^\/%]*'), Validators.minLength(3)],
    updateOn: 'change' || 'submit'});

  /**
   * Form Input for the Model Privacy. By default it is Public (0).
   */
  public privacyInputForm = new FormControl(0);

  public hasPullRequest = false;

  /**
   * Confirmation dialog reference.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * Decide to redirect to new new pr page or not
   */
  private createPr = false;

  /**
   * List of Organizations the user is in
   */
  private organization: string[] = [];

  /**
   * @param authService Service to get authentication details
   * @param dialog Dialog to display warnings
   * @param location Provides a way to go back to the previous page
   * @param modelService Service to request model creation
   * @param router Router to navigate to other URLs
   * @param snackBar Snackbar to display notifications
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public location: Location,
    public modelService: ModelService,
    public router: Router,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    this.hasPullRequest = (localStorage.getItem('pullRequest_creation') === 'true');
    if (this.authService.isAuthenticated()) {
      // Prepare the list of owners the model could have. Username goes first, followed by
      // the organizations (sorted alphabetically).
      this.ownerList = [this.authService.userProfile.username,
        ...this.authService.userProfile.orgs.sort()];
      this.organization = [...this.authService.userProfile.orgs.sort()];
    }
  }

  /**
   * Callback to the FileUploadComponent's files event. Keeps track of the uploaded files.
   *
   * @param files List of files received.
   */
  public onReceiveFiles(files: File[]): void {
    this.fileList = files;
  }

  /**
   * Modify the Description based on the event received.
   *
   * @param description The modified description.
   */
  public onModifyDescription(description: string): void {
    this.description = description;
  }

  /**
   * Modify the Categories based on the event received.
   *
   * @param categories The modified categories.
   */
  public onModifyCategories(categories: string[]): void {
    this.categories = categories;
  }

  /**
   * Callback when upload button is pressed.
   *
   * Verifies that the model can be uploaded.
   */
  public verifyBeforeUpload(): boolean | undefined {
    // Check if the model has at least one file.
    if (!this.fileList || this.fileList.length === 0) {
      this.snackBar.open('Please add files to be uploaded.', 'Got it');
      return;
    }

    // Check that the model has a name.
    // The required validator doesn't trim the value of the input.
    this.modelNameInputForm.setValue(this.modelNameInputForm.value.trim());
    this.modelNameInputForm.updateValueAndValidity();

    if (this.modelNameInputForm.value === undefined || this.modelNameInputForm.value === '') {
      this.snackBar.open('Please provide a model name.', 'Got it');
      return;
    } else if (this.modelNameInputForm.value.includes('/')) {
      this.snackBar.open('A model name cannot have a forward slash ("/").',
        'Got it');
      return;
    } else if (this.modelNameInputForm.value.includes('%')) {
      this.snackBar.open('A model name cannot have a percent ("%").',
        'Got it');
      return;
    }

    this.modelName = this.modelNameInputForm.value;
    this.urlName = this.modelName.replace(/ /g, '_');

    // Perform some basic checks on files
    let hasThumbnails: boolean = false;
    let hasConfig: boolean = false;
    let hasSDF: boolean = false;
    for (const file of this.fileList) {

      // Check thumbnails
      const path = file['fullPath'].split('/');
      const index = path.indexOf('thumbnails');

      // The folder needs to be in the root path.
      // Check if it's a child, in case the uploaded root folder is removed.
      if ((index === 0 && path.length > 1) ||
          (index === 1 && path.length > 2)) {
        hasThumbnails = true;
      }

      // There must be a model.config
      const filename = path[path.length - 1];
      // TODO(german-mas) Provide a class to handle Files and their extensions in a simpler way.
      // Avoid duplicated toLowerCase calls in Edit and New components.
      // See: https://app.asana.com/0/660089940802243/729343249232870/f
      if (filename === 'model.config') {
        hasConfig = true;
      }

      // There must be a .sdf file
      if (filename.toLowerCase().indexOf('.sdf') > 0) {
        hasSDF = true;
      }
    }

    if (!hasConfig) {
      this.snackBar.open(`Missing a 'model.config' file. It must be lowercase.`, 'Got it');
      return;
    }

    if (!hasSDF) {
      this.snackBar.open('Missing an SDF file.', 'Got it');
      return;
    }

    if (!hasThumbnails) {
      this.openThumbnailsWarning();
      return;
    }

    return true;
  }

  /**
   * Upload the model.
   *
   * This is the final step in the upload process. It doesn't verify the model.
   */
  public upload(): void {

    this.uploading = true;
    this.modelNameInputForm.disable();

    const formData = new FormData();
    formData.append('name', this.modelName.trim());
    formData.append('URLName', this.urlName.trim());
    formData.append('description', this.description.trim());
    formData.append('tags', this.tags.join());
    formData.append('categories', this.categories.join());
    formData.append('license', (this.license + 1).toString());
    formData.append('owner', this.ownerList[this.owner]);

    const privacyBoolean = !!this.privacyInputForm.value;
    formData.append('private', privacyBoolean.toString());
    formData.append('permission', this.privacyInputForm.value.toString());

    for (const file of this.fileList) {
      formData.append('file', file, (file as any).fullPath);
    }

    this.uploadSubscriber = this.modelService.upload(formData)
      .subscribe(
        (response) => {
          if (response.status !== 200) {
            this.snackBar.open('Something went wrong', 'Got it');
            this.cancelUpload();
            return;
          } else {
            if (this.createPr) {
              this.router.navigate([
                `/${this.ownerList[this.owner]}/fuel/models/review/${this.modelName.trim()}`
              ]);
              this.createPr = false;
            } else {
              this.router.navigate([
                `/${this.ownerList[this.owner]}/models/${this.modelName.trim()}`
              ]);
            }
          }
        },
        (error) => {
          this.cancelUpload();
          this.snackBar.open(`${error.message}`, 'Got it');
          if (error.code === ErrMsg.ErrorFormDuplicateModelName) {
            this.modelNameInputForm.setErrors({
              duplicated: true
            });
          }
        });
  }

  /**
   * Upload new model directly without creating pr
   */
  public directUpload(): void {
    // Verifies the model has the necessary files to be uploaded
    const verified = this.verifyBeforeUpload();

    if (verified) {
    //   // All is good
      this.upload();
    }
  }

  /**
   * Upload a new model and create a new pr
   */
  public uploadAndCreatePr(): void {
    this.createPr = true;
    const privacyBoolean = !!this.privacyInputForm.value;
    const isOrganization = this.organization.includes(this.ownerList[this.owner]);
    const verified = this.verifyBeforeUpload();

    if (!privacyBoolean) {
      this.snackBar.open('Model must be private if a review is to be created', 'Got it');
      return;
    }

    if (!isOrganization) {
      this.snackBar.open('User needs to be an organization', 'Got it');
      return;
    }

    if (verified) {
      this.upload();
    }
  }

  /**
   * Callback when cancel button is pressed while uploading.
   */
  public cancelUpload(): void {
    this.uploading = false;
    this.modelNameInputForm.enable();
    if (this.uploadSubscriber) {
      this.uploadSubscriber.unsubscribe();
    }
    this.snackBar.open('Upload cancelled.', 'Got it');
  }

  /**
   * Error message of the Model Name input field.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  public getModelNameError(): string {
    // Empty model name.
    if (this.modelNameInputForm.hasError('required')) {
      return 'This field is required';
    }

    // Duplicated model name.
    if (this.modelNameInputForm.hasError('duplicated')) {
      return 'This model name already exists. Please use a different one.';
    }

    // Length error.
    if (this.modelNameInputForm.hasError('minlength')) {
      return 'Name must have three or more characters.';
    }

    // No error.
    return '';
  }

  /**
   * Open the thumbnails warning dialog.
   */
  public openThumbnailsWarning(): void {

    const dialogOps = {
      data: {
        title: 'Thumbnails',
        message: 'Your model has no thumbnails. ' +
                 '<br>You can upload a <strong>/thumbnails</strong> ' +
                 'folder with any images you want to display.',
        buttonText: 'Upload without thumbnails'
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Check for the result of the dialog. Upload when the user accepts.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result === true) {
            this.upload();
          }
      });
  }
}
