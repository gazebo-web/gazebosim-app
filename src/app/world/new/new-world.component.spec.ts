import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { of, throwError } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';

import { AuthService } from '../../auth/auth.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog';
import { DescriptionComponent } from '../../description/description.component';
import { DndDirective } from '../../dnd/dnd.directive';
import { FileUploadComponent } from '../../file-upload/file-upload.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { NewWorldComponent } from './new-world.component';
import { PageTitleComponent } from '../../page-title';
import { SdfViewerComponent } from '../../model/sdfviewer/sdfviewer.component';
import { TagsComponent } from '../../tags/tags.component';
import { WorldService } from '../world.service';

describe('NewWorldComponent', () => {
  let fixture: ComponentFixture<NewWorldComponent>;
  let component: NewWorldComponent;

  // Mock file values.
  const testFile1 = new File([], 'file1.stl');
  testFile1['fullPath'] = 'file1.stl';

  const testFile2 = new File([], 'file2.dae');
  testFile2['fullPath'] = 'file2.dae';

  const testWorldFile = new File([], 'file.sdf');
  testWorldFile['fullPath'] = 'file.sdf';

  const testThumbnails = new File([], 'img0.jpg');
  testThumbnails['fullPath'] = 'thumbnails/img0.jpg';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        MarkdownModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        ConfirmationDialogComponent,
        DescriptionComponent,
        DndDirective,
        FileUploadComponent,
        NewWorldComponent,
        PageTitleComponent,
        SdfViewerComponent,
        TagsComponent,
        ],
      providers: [
        AuthService,
        WorldService,
        JsonClassFactoryService
        ],
    });

    // TestBed can't have entryComponents directly. We need to set them the following way.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ ConfirmationDialogComponent ],
      },
    });

    fixture = TestBed.createComponent(NewWorldComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should have the authenticated user as owner', () => {
    const authService = TestBed.inject(AuthService);

    // No authenticated user.
    component.ngOnInit();
    expect(component.owner).toBe(0);
    expect(component.ownerList.length).toBe(0);

    // Mock the authenticated user.
    spyOn(authService, 'isAuthenticated').and.returnValue(true);
    authService.userProfile = {
      username: 'testOwner',
      orgs: ['testOrg1'],
      orgRoles: {
        testOrg1: 'owner',
      }
    };

    component.ngOnInit();
    expect(component.owner).toBe(0);
    expect(component.ownerList[0]).toBe('testOwner');
    expect(component.ownerList[1]).toBe('testOrg1');
  });

  it('should NOT upload without files', () => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there are no files.
    component.fileList = [];
    component.verifyBeforeUpload();
    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should NOT upload if the world name is empty', () => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there is no name.
    component.fileList = [testFile1];
    component.worldNameInputForm.setValue('');
    component.verifyBeforeUpload();

    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should NOT upload without a .sdf file', () => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there is no config file.
    component.worldNameInputForm.setValue('Test World');
    component.fileList = [testFile1];
    component.verifyBeforeUpload();

    expect(component.worldName).toBe('Test World');
    expect(component.urlName).toBe('Test_World');
    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should open the thumbnail warning dialog if there are no thumbnails', () => {
    spyOn(component, 'upload');
    spyOn(component, 'openThumbnailsWarning');

    // Should return warn about the thumbnails.
    component.worldNameInputForm.setValue('Test World');
    component.fileList = [testFile1, testFile2, testWorldFile];
    component.verifyBeforeUpload();

    expect(component.worldName).toBe('Test World');
    expect(component.urlName).toBe('Test_World');
    expect(component.upload).not.toHaveBeenCalled();
    expect(component.openThumbnailsWarning).toHaveBeenCalled();
  });

  it('should allow to upload if all requirements are met', () => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');
    spyOn(component, 'openThumbnailsWarning');

    component.worldNameInputForm.setValue('Test World');
    component.fileList = [testFile1, testWorldFile, testThumbnails];
    component.verifyBeforeUpload();

    expect(component.worldName).toBe('Test World');
    expect(component.urlName).toBe('Test_World');
    expect(component.openThumbnailsWarning).not.toHaveBeenCalled();
    expect(component.upload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeNull();
  });

  it('should create the form and call the service upload with it', () => {
    const service = component.worldService;
    const authService = component.authService;
    const router = component.router;
    spyOn(service, 'upload').and.returnValue(of({status: 200}));
    spyOn(router, 'navigate');

    // Mock authenticated user.
    authService.userProfile = {
      username: 'testOwner'
    };

    // Set the data.
    component.worldName = 'testWorld';
    component.urlName = 'testWorld';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testFile1, testFile2];

    // Mock form data.
    const testForm = new FormData();
    testForm.append('name', 'testWorld');
    testForm.append('URLName', 'testWorld');
    testForm.append('description', 'test description');
    testForm.append('tags', 'tag1,tag2');
    testForm.append('license', '1');
    testForm.append('permission', '0');
    testForm.append('owner', 'testOwner');
    testForm.append('file', 'path/to/model.config');
    testForm.append('file', 'path/to/model.sdf');

    component.upload();

    expect(component.uploading).toBe(true);
    expect(component.worldNameInputForm.disabled).toBe(true);
    expect(service.upload).toHaveBeenCalledWith(testForm);
    expect(router.navigate).toHaveBeenCalledWith(['/testOwner/worlds/testWorld']);
    //
  });

  it('should cancel the upload on an incorrect response status', () => {
    const snackBar = component.snackBar;
    const service = component.worldService;
    spyOn(service, 'upload').and.returnValue(of({status: 500}));
    spyOn(component, 'cancelUpload');

    component.worldName = 'testWorld';
    component.urlName = 'testWorld';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testFile1, testFile2];

    component.upload();

    expect(component.cancelUpload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should cancel the upload on an error response', () => {
    const snackBar = component.snackBar;
    const service = component.worldService;
    spyOn(service, 'upload').and.returnValue(throwError({}));
    spyOn(component, 'cancelUpload');

    component.worldName = 'testWorld';
    component.urlName = 'testWorld';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testFile1, testFile2];

    component.upload();

    expect(component.cancelUpload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should cancel the upload', () => {
    const snackBar = component.snackBar;

    component.cancelUpload();

    expect(component.uploading).toBe(false);
    expect(component.worldNameInputForm.enabled).toBe(true);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should return the error if the name is empty', () => {
    // Manually set the error.
    component.worldNameInputForm.setErrors({
      required: true
    });

    const error: string = component.getWorldNameError();

    expect(error).toBe('This field is required');
  });

  it('should return the error if the name is duplicated', () => {
    // Manually set the error.
    component.worldNameInputForm.setErrors({
      duplicated: true
    });

    const error: string = component.getWorldNameError();

    expect(error).toBe('This world name already exists. Please use a different one.');
  });

  it(`should NOT highlight an error if there isn't any`, () => {
    // Manually set no errors.
    component.worldNameInputForm.setErrors({});

    const error: string = component.getWorldNameError();

    expect(error).toBe('');
  });
});
