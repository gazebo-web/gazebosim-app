import { CommonModule, Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { DescriptionComponent } from 'src/app/description';
import { ErrMsg } from '../../server/err-msg';
import { FileUploadComponent } from 'src/app/file-upload';
import { TagsComponent } from 'src/app/tags';
import { World } from '../world';
import { WorldService } from '../world.service';

@Component({
  selector: 'gz-new-world',
  templateUrl: 'new-world.component.html',
  styleUrls: ['new-world.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DescriptionComponent,
    FileUploadComponent,
    FlexLayoutModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    TagsComponent,
  ],
})

/**
 * New World Component is the page that allows users to upload worlds.
 */
export class NewWorldComponent implements OnInit {

  /**
   * List of owners the world could have. Includes the logged in user and their organizations
   * (if they have the correct permissions).
   */
  public ownerList: string[] = [];

  /**
   * Index of the selected owner from the list. By default, it's the logged user.
   */
  public owner: number = 0;

  /**
   * World human readable name.
   */
  public worldName: string;

  /**
   * World name for the URL.
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
  public allowedExtensions: string[] = World.allowedExtensions;

  /**
   * Selected license's index (CC-BY by default).
   */
  public license: number = 1;

  /**
   * List of tags.
   */
  public tags: string[] = [];

  /**
   * World description.
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
   * Indicated whether already uploading the world.
   */
  public uploading: boolean = false;

  /**
   * The subscription to the Upload Observable from the New World Service.
   */
  public uploadSubscriber: Subscription;

  /**
   * Form Input for the World Name. Allows better error handling.
   */
  public worldNameInputForm = new FormControl('',
    {validators: [Validators.required, Validators.pattern('[^\/%]*'), Validators.minLength(3)],
    updateOn: 'change' || 'submit'});

  /**
   * Form Input for the World Privacy. By default it is Public (0).
   */
  public privacyInputForm = new FormControl(0);

  /**
   * Confirmation dialog reference.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param authService Service to get authentication details
   * @param dialog Dialog to display warnings
   * @param location Provides a way to go back to the previous page
   * @param worldService Service to request world creation
   * @param router Router to navigate to other URLs
   * @param snackBar Snackbar to display notifications
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public location: Location,
    public worldService: WorldService,
    public router: Router,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      // Prepare the list of owners the model could have. Username goes first, followed by
      // the organizations (sorted alphabetically).
      this.ownerList = [this.authService.userProfile.username,
        ...this.authService.userProfile.orgs.sort()];
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
   * Callback when upload button is pressed.
   *
   * Verifies that the world can be uploaded, and does so if it can.
   */
  public verifyBeforeUpload(): void {
    // Check if the world has at least one file.
    if (!this.fileList || this.fileList.length === 0) {
      this.snackBar.open('Please add files to be uploaded.', 'Got it');
      return;
    }

    // Check that the world has a name.
    // The required validator doesn't trim the value of the input.
    this.worldNameInputForm.setValue(this.worldNameInputForm.value.trim());
    this.worldNameInputForm.updateValueAndValidity();

    if (this.worldNameInputForm.value === undefined || this.worldNameInputForm.value === '') {
      this.snackBar.open('Please provide a world name.', 'Got it');
      return;
    } else if (this.worldNameInputForm.value.includes('/')) {
      this.snackBar.open('A world name cannot have a forward slash ("/").',
        'Got it');
      return;
    } else if (this.worldNameInputForm.value.includes('%')) {
      this.snackBar.open('A world name cannot have a percent ("%").',
        'Got it');
      return;
    }

    this.worldName = this.worldNameInputForm.value;
    this.urlName = this.worldName.replace(/ /g, '_');

    // Perform some basic checks on files
    let hasThumbnails: boolean = false;
    let hasRequiredFile: boolean = false;
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

      // A world needs a .sdf file. A .world file is no longer allowed.
      // TODO(german-mas) Provide a class to handle Files and their extensions in a simpler way.
      // Avoid duplicated toLowerCase calls in Edit and New components.
      // See: https://app.asana.com/0/660089940802243/729343249232870/f
      const filename = path[path.length - 1].toLowerCase();
      if (filename.indexOf('.sdf') > 0) {
        hasRequiredFile = true;
      }
    }

    if (!hasRequiredFile) {
      this.snackBar.open('Missing a SDF file.', 'Got it');
      return;
    }

    if (!hasThumbnails) {
      this.openThumbnailsWarning();
      return;
    }

    // All is good
    this.upload();
  }

  /**
   * Upload the world.
   *
   * This is the final step in the upload process. It doesn't verify the world.
   */
  public upload(): void {

    this.uploading = true;
    this.worldNameInputForm.disable();

    const formData = new FormData();
    formData.append('name', this.worldName.trim());
    formData.append('URLName', this.urlName.trim());
    formData.append('description', this.description.trim());
    formData.append('tags', this.tags.join());
    formData.append('license', (this.license + 1).toString());
    formData.append('owner', this.ownerList[this.owner]);

    const privacyBoolean = !!this.privacyInputForm.value;
    formData.append('private', privacyBoolean.toString());
    formData.append('permission', this.privacyInputForm.value.toString());

    for (const file of this.fileList) {
      formData.append('file', file, (file as any).fullPath);
    }

    this.uploadSubscriber = this.worldService.upload(formData)
      .subscribe(
        (response) => {
          if (response.status !== 200) {
            this.snackBar.open('Something went wrong', 'Got it');
            this.cancelUpload();
            return;
          }
          this.router.navigate([`/${this.ownerList[this.owner]}/worlds/${this.worldName.trim()}`]);
        },
        (error) => {
          this.cancelUpload();
          this.snackBar.open(`${error.message}`, 'Got it');
          if (error.code === ErrMsg.ErrorFormDuplicateWorldName) {
            this.worldNameInputForm.setErrors({
              duplicated: true
            });
          }
        });
  }

  /**
   * Callback when cancel button is pressed while uploading.
   */
  public cancelUpload(): void {
    this.uploading = false;
    this.worldNameInputForm.enable();
    if (this.uploadSubscriber) {
      this.uploadSubscriber.unsubscribe();
    }
    this.snackBar.open('Upload cancelled.', 'Got it');
  }

  /**
   * Error message of the World Name input field.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  public getWorldNameError(): string {
    // Empty world name.
    if (this.worldNameInputForm.hasError('required')) {
      return 'This field is required';
    }

    // Duplicated world name.
    if (this.worldNameInputForm.hasError('duplicated')) {
      return 'This world name already exists. Please use a different one.';
    }

    // Length error.
    if (this.worldNameInputForm.hasError('minlength')) {
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
        message: 'Your world has no thumbnails. ' +
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
