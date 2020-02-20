import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable } from 'rxjs/Observable';

import {
  MatButtonModule,
  MatChipsModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatRadioModule,
  MatSelectModule,
  MatSnackBarModule,
} from '@angular/material';
import { MarkdownModule } from 'ngx-markdown';

import { AuthService } from '../../auth/auth.service';
import { CategoriesComponent } from '../../fuel-resource/categories/categories.component';
import { ConfirmationDialogComponent } from '../../confirmation-dialog';
import { DescriptionComponent } from '../../description/description.component';
import { DndDirective } from '../../dnd/dnd.directive';
import { FileUploadComponent } from '../../file-upload/file-upload.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { ModelService } from '../model.service';
import { NewModelComponent } from './new-model.component';
import { PageTitleComponent } from '../../page-title';
import { SdfViewerComponent } from '../sdfviewer/sdfviewer.component';
import { TagsComponent } from '../../tags/tags.component';

describe('NewModelComponent', () => {
  let fixture: ComponentFixture<NewModelComponent>;
  let component: NewModelComponent;

  // Mock file values.
  const testFile1 = new File([], 'file1.stl');
  testFile1['fullPath'] = 'file1.stl';

  const testConfig = new File([], 'model.config');
  testConfig['fullPath'] = 'model.config';

  const testSdf = new File([], 'model.sdf');
  testSdf['fullPath'] = 'model.sdf';

  const testThumbnails = new File([], 'img0.jpg');
  testThumbnails['fullPath'] = 'thumbnails/img0.jpg';

  beforeEach(async(() => {
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
        CategoriesComponent,
        ConfirmationDialogComponent,
        DescriptionComponent,
        DndDirective,
        FileUploadComponent,
        NewModelComponent,
        PageTitleComponent,
        SdfViewerComponent,
        TagsComponent,
        ],
      providers: [
        AuthService,
        ModelService,
        JsonClassFactoryService
        ],
    });

    // TestBed can't have entryComponents directly. We need to set them the following way.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ ConfirmationDialogComponent ],
      },
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewModelComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should have the authenticated user as owner', async(() => {
    const authService = TestBed.get(AuthService);

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
  }));

  it('should NOT upload without files', async(() => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there are no files.
    component.fileList = [];
    component.verifyBeforeUpload();
    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should NOT upload if the model name is empty', async(() => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there is no name.
    component.fileList = [testFile1];
    component.modelNameInputForm.setValue('');
    component.verifyBeforeUpload();

    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should NOT upload without a model.config file', async(() => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there is no config file.
    component.modelNameInputForm.setValue('Test Model');
    component.fileList = [testFile1, testSdf];
    component.verifyBeforeUpload();

    expect(component.modelName).toBe('Test Model');
    expect(component.urlName).toBe('Test_Model');
    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should NOT upload without a .sdf file', async(() => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');

    // Should return if there is no sdf file.
    component.modelNameInputForm.setValue('Test Model');
    component.fileList = [testFile1, testConfig];
    component.verifyBeforeUpload();

    expect(component.modelName).toBe('Test Model');
    expect(component.urlName).toBe('Test_Model');
    expect(component.upload).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should open the thumbnail warning dialog if there are no thumbnails', async(() => {
    spyOn(component, 'upload');
    spyOn(component, 'openThumbnailsWarning');

    // Should return warn about the thumbnails.
    component.modelNameInputForm.setValue('Test Model');
    component.fileList = [testFile1, testConfig, testSdf];
    component.verifyBeforeUpload();

    expect(component.modelName).toBe('Test Model');
    expect(component.urlName).toBe('Test_Model');
    expect(component.openThumbnailsWarning).toHaveBeenCalled();
    expect(component.upload).not.toHaveBeenCalled();
  }));

  it('should allow to upload if all requirements are met', async(() => {
    const snackBar = component.snackBar;
    spyOn(component, 'upload');
    spyOn(component, 'openThumbnailsWarning');

    component.modelNameInputForm.setValue('Test Model');
    component.fileList = [testFile1, testConfig, testSdf, testThumbnails];
    component.verifyBeforeUpload();

    expect(component.modelName).toBe('Test Model');
    expect(component.urlName).toBe('Test_Model');
    expect(component.openThumbnailsWarning).not.toHaveBeenCalled();
    expect(component.upload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeNull();
  }));

  it('should create the form and call the service upload with it', async(() => {
    const service = component.modelService;
    const authService = component.authService;
    const router = component.router;
    spyOn(service, 'upload').and.returnValue(Observable.of({status: 200}));
    spyOn(router, 'navigate');

    // Mock authenticated user.
    authService.userProfile = {
      username: 'testOwner',
      orgs: ['testOrg1'],
      orgRoles: {
        testOrg1: 'owner',
      }
    };

    // Set the data.
    component.modelName = 'testModel';
    component.urlName = 'testModel';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testConfig, testSdf];

    // Mock form data.
    const testForm = new FormData();
    testForm.append('name', 'testModel');
    testForm.append('URLName', 'testModel');
    testForm.append('description', 'test description');
    testForm.append('tags', 'tag1,tag2');
    testForm.append('license', '1');
    testForm.append('permission', '0');
    testForm.append('owner', 'testOwner');
    testForm.append('file', 'path/to/model.config');
    testForm.append('file', 'path/to/model.sdf');

    component.upload();

    expect(component.uploading).toBe(true);
    expect(component.modelNameInputForm.disabled).toBe(true);
    expect(service.upload).toHaveBeenCalledWith(testForm);
    expect(router.navigate).toHaveBeenCalledWith(['/testOwner/models/testModel']);
    //
  }));

  it('should cancel the upload on an incorrect response status', async(() => {
    const snackBar = component.snackBar;
    const service = component.modelService;
    spyOn(service, 'upload').and.returnValue(Observable.of({status: 500}));
    spyOn(component, 'cancelUpload');

    component.modelName = 'testModel';
    component.urlName = 'testModel';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testConfig, testSdf];

    component.upload();

    expect(component.cancelUpload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should cancel the upload on an error response', async(() => {
    const snackBar = component.snackBar;
    const service = component.modelService;
    spyOn(service, 'upload').and.returnValue(Observable.throw({}));
    spyOn(component, 'cancelUpload');

    component.modelName = 'testModel';
    component.urlName = 'testModel';
    component.description = 'test description';
    component.tags = ['tag1', 'tag2'];
    component.license = 0;
    component.ownerList = ['testOwner'];
    component.owner = 0;
    component.fileList = [testConfig, testSdf];

    component.upload();

    expect(component.cancelUpload).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should cancel the upload', async(() => {
    const snackBar = component.snackBar;

    component.cancelUpload();

    expect(component.uploading).toBe(false);
    expect(component.modelNameInputForm.enabled).toBe(true);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should return the error if the name is empty', async(() => {
    // Manually set the error.
    component.modelNameInputForm.setErrors({
      required: true
    });

    const error: string = component.getModelNameError();

    expect(error).toBe('This field is required');
  }));

  it('should return the error if the name is duplicated', async(() => {
    // Manually set the error.
    component.modelNameInputForm.setErrors({
      duplicated: true
    });

    const error: string = component.getModelNameError();

    expect(error).toBe('This model name already exists. Please use a different one.');
  }));

  it(`should NOT highlight an error if there isn't any`, async(() => {
    // Manually set no errors.
    component.modelNameInputForm.setErrors({});

    const error: string = component.getModelNameError();

    expect(error).toBe('');
  }));
});
