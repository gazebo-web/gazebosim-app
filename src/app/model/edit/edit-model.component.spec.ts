import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import {
  MatButtonModule,
  MatChipsModule,
  MatDialog,
  MatDialogModule,
  MatIconModule,
  MatSelectModule,
  MatInputModule,
  MatListModule,
  MatRadioModule,
  MatSnackBar,
  MatSnackBarModule,
  MatTableModule,
} from '@angular/material';
import { MarkdownModule } from 'ngx-markdown';

import { AuthService } from '../../auth/auth.service';
import { CategoriesComponent } from '../../fuel-resource/categories/categories.component';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { DescriptionComponent } from '../../description/description.component';
import { DndDirective } from '../../dnd/dnd.directive';
import { EditModelComponent } from './edit-model.component';
import { FileUploadComponent } from '../../file-upload/file-upload.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Model } from '../model';
import { ModelService } from '../model.service';
import { PageTitleComponent } from '../../page-title';
import { SdfViewerComponent } from '../sdfviewer/sdfviewer.component';
import { TagsComponent } from '../../tags/tags.component';
import { MetadataComponent } from '../../metadata/metadata.component';

describe('EditModelComponent', () => {

  let fixture: ComponentFixture<EditModelComponent>;
  let component: EditModelComponent;

  let service: ModelService;
  let router: Router;
  let snackBar: MatSnackBar;
  let dialog: MatDialog;

  // Test Model
  const testModelJson = {
    name: 'test-model-name',
    owner: 'test-model-owner',
    description: 'test-model-description',
    tags: ['test-tag-1', 'test-tag-2', 'test-tag-3']
  };

  const testModel: Model = new Model(testModelJson);

  // Mock files
  let fileSdf: File;
  let fileConfig: File;

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
        MatListModule,
        MatRadioModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTableModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        CategoriesComponent,
        ConfirmationDialogComponent,
        DescriptionComponent,
        DndDirective,
        EditModelComponent,
        FileUploadComponent,
        MetadataComponent,
        PageTitleComponent,
        SdfViewerComponent,
        TagsComponent
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        ModelService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: testModel
              }
            }
          }
        },
        ],
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ ConfirmationDialogComponent ],
      },
    });

    // Reset the fixture and component.
    fixture = TestBed.createComponent(EditModelComponent);
    component = fixture.componentInstance;

    // Get the injected services.
    dialog = TestBed.get(MatDialog);
    router = TestBed.get(Router);
    service = TestBed.get(ModelService);
    snackBar = TestBed.get(MatSnackBar);

    // Reset files
    fileSdf = new File([''], 'model.sdf');
    fileSdf['fullPath'] = 'path/to/model.sdf';
    fileConfig = new File([''], 'model.config');
    fileConfig['fullPath'] = 'path/to/model.config';
  });

  it('should not log to console', () => {
    spyOn(console, 'log');

    expect(component).toBeTruthy();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should obtain the model from the route during OnInit', () => {
    component.ngOnInit();

    expect(component.model).toBe(testModel);
  });

  it('should mark the tags as modified', () => {
    component.ngOnInit();

    expect(component.tagsModified).toBe(false);
    component.onModifyTags();
    expect(component.tagsModified).toBe(true);
  });

  it('should mark the description as modified', () => {
    component.ngOnInit();

    expect(component.model.description).toBe('test-model-description');
    expect(component.descriptionModified).toBe(false);

    component.onModifyDescription('new-description');

    expect(component.model.description).toBe('new-description');
    expect(component.descriptionModified).toBe(true);
  });

  it('should use the model service to edit the model', () => {
    component.model = testModel;

    const testEditedModel: Model = new Model({
      description: 'edited-description',
      tags: ['tag1', 'tag2']
    });

    spyOn(service, 'edit').and.returnValue(Observable.of(testEditedModel));
    spyOn(component, 'back');

    component.onEdit();

    expect(component.tagsModified).toBe(false);
    expect(component.descriptionModified).toBe(false);
    expect(component.model.description).toBe('edited-description');
    expect(component.model.tags.length).toBe(2);
    expect(component.model.tags[0]).toBe('tag1');
    expect(component.model.tags[1]).toBe('tag2');
    expect(snackBar._openedSnackBarRef).toBeTruthy();
    expect(component.back).toHaveBeenCalled();
  });

  it('should call the model service to edit only the description', () => {
    component.model = testModel;
    component.descriptionModified = true;

    spyOn(service, 'edit').and.returnValue(Observable.of({status: 200}));
    spyOn(component, 'back');
    component.onEdit();

    // Arguments on the editModel method.
    const owner = testModel.owner;
    const name = testModel.name;
    const mockForm = new FormData();
    mockForm.append('description', testModel.description);

    expect(service.edit).toHaveBeenCalledWith(owner, name, mockForm);
    expect(component.back).toHaveBeenCalled();
    expect(component.descriptionModified).toBe(false);
  });

  it('should call the model service to edit only the tags', () => {
    component.model = testModel;
    component.tagsModified = true;

    spyOn(service, 'edit').and.returnValue(Observable.of({status: 200}));
    spyOn(component, 'back');
    component.onEdit();

    // Arguments on the editModel method.
    const owner = testModel.owner;
    const name = testModel.name;
    const mockForm = new FormData();
    mockForm.append('tags', testModel.tags.join());

    expect(service.edit).toHaveBeenCalledWith(owner, name, mockForm);
    expect(component.back).toHaveBeenCalled();
    expect(component.tagsModified).toBe(false);
  });

  it('should NOT edit the files without a .sdf file', () => {
    component.model = testModel;
    component.descriptionModified = false;
    component.tagsModified = false;
    component.fileList = [fileConfig];

    spyOn(service, 'edit').and.returnValue(Observable.of({status: 200}));

    component.onEdit();

    expect(service.edit).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should NOT edit the files without a model.config file', () => {
    component.model = testModel;
    component.descriptionModified = false;
    component.tagsModified = false;
    component.fileList = [fileSdf];

    spyOn(service, 'edit').and.returnValue(Observable.of({status: 200}));

    component.onEdit();

    expect(service.edit).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should open a snackbar on an edit error', () => {
    component.model = testModel;
    component.descriptionModified = false;
    component.tagsModified = false;

    spyOn(service, 'edit').and.returnValue(Observable.throw({}));

    component.onEdit();

    expect(service.edit).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should open the delete dialog', () => {
    component.model = testModel;

    spyOn(dialog, 'open').and.callThrough();

    component.onDelete();

    expect(dialog.open).toHaveBeenCalled();
  });

  it(`should go back to the model's detail page`, () => {
    component.model = testModel;

    spyOn(router, 'navigate');
    const routeCalled = `${component.model.owner}/models/${component.model.name}`;

    component.back();

    expect(router.navigate).toHaveBeenCalledWith([routeCalled]);
  });
});
