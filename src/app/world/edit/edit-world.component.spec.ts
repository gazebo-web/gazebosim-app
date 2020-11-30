import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { of, throwError } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';

import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { EditWorldComponent } from './edit-world.component';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { AuthService } from '../../auth/auth.service';
import { DescriptionComponent } from '../../description/description.component';
import { DndDirective } from '../../dnd/dnd.directive';
import { FileUploadComponent } from '../../file-upload/file-upload.component';
import { PageTitleComponent } from '../../page-title';
import { SdfViewerComponent } from '../../model/sdfviewer/sdfviewer.component';
import { TagsComponent } from '../../tags/tags.component';
import { World } from '../world';
import { WorldService } from '../world.service';

describe('EditWorldComponent', () => {

  let fixture: ComponentFixture<EditWorldComponent>;
  let component: EditWorldComponent;

  let service: WorldService;
  let router: Router;
  let snackBar: MatSnackBar;
  let dialog: MatDialog;

  // Test World
  const testWorldJson = {
    name: 'test-world-name',
    owner: 'test-world-owner',
    description: 'test-world-description',
    tags: ['test-tag-1', 'test-tag-2', 'test-tag-3']
  };

  const testWorld: World = new World(testWorldJson);

  // Mock files
  let fileSdf: File;
  let fileWorld: File;
  let fileOther: File;

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
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        ConfirmationDialogComponent,
        DescriptionComponent,
        DndDirective,
        EditWorldComponent,
        FileUploadComponent,
        PageTitleComponent,
        SdfViewerComponent,
        TagsComponent
        ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        WorldService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: testWorld
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
    fixture = TestBed.createComponent(EditWorldComponent);
    component = fixture.componentInstance;

    // Get the injected services.
    dialog = TestBed.inject(MatDialog);
    router = TestBed.inject(Router);
    service = TestBed.inject(WorldService);
    snackBar = TestBed.inject(MatSnackBar);

    // Reset files
    fileSdf = new File([''], 'test.sdf');
    fileSdf['fullPath'] = 'path/to/test.sdf';
    fileWorld = new File([''], 'test.world');
    fileWorld['fullPath'] = 'path/to/test.world';
    fileOther = new File([''], 'test.png');
    fileOther['fullPath'] = 'path/to/test.png';
  });

  it('should not log to console', () => {
    spyOn(console, 'log');

    expect(component).toBeTruthy();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should obtain the world from the route during OnInit', () => {
    component.ngOnInit();

    expect(component.world).toBe(testWorld);
  });

  it('should mark the tags as modified', () => {
    component.ngOnInit();

    expect(component.tagsModified).toBe(false);
    component.onModifyTags();
    expect(component.tagsModified).toBe(true);
  });

  it('should mark the description as modified', () => {
    component.ngOnInit();

    expect(component.world.description).toBe('test-world-description');
    expect(component.descriptionModified).toBe(false);

    component.onModifyDescription('new-description');

    expect(component.world.description).toBe('new-description');
    expect(component.descriptionModified).toBe(true);
  });

  it('should use the world service to edit the world', () => {
    component.world = testWorld;

    const testEditedWorld: World = new World({
      description: 'edited-description',
      tags: ['tag1', 'tag2']
    });

    spyOn(service, 'edit').and.returnValue(of(testEditedWorld));
    spyOn(component, 'back');

    component.onEdit();

    expect(component.tagsModified).toBe(false);
    expect(component.descriptionModified).toBe(false);
    expect(component.world.description).toBe('edited-description');
    expect(component.world.tags.length).toBe(2);
    expect(component.world.tags[0]).toBe('tag1');
    expect(component.world.tags[1]).toBe('tag2');
    expect(snackBar._openedSnackBarRef).toBeTruthy();
    expect(component.back).toHaveBeenCalled();
  });

  it('should call the world service to edit only the description', () => {
    component.world = testWorld;
    component.descriptionModified = true;

    spyOn(service, 'edit').and.returnValue(of(testWorld));
    spyOn(component, 'back');
    component.onEdit();

    // Arguments on the editWorld method.
    const owner = testWorld.owner;
    const name = testWorld.name;
    const mockForm = new FormData();
    mockForm.append('description', testWorld.description);

    expect(service.edit).toHaveBeenCalledWith(owner, name, mockForm);
    expect(component.descriptionModified).toBe(false);
    expect(component.back).toHaveBeenCalled();
  });

  it('should call the world service to edit only the tags', () => {
    component.world = testWorld;
    component.tagsModified = true;

    spyOn(component, 'back');
    spyOn(service, 'edit').and.returnValue(of(testWorld));
    component.onEdit();

    // Arguments on the editWorld method.
    const owner = testWorld.owner;
    const name = testWorld.name;
    const mockForm = new FormData();
    mockForm.append('tags', testWorld.tags.join());

    expect(service.edit).toHaveBeenCalledWith(owner, name, mockForm);
    expect(component.tagsModified).toBe(false);
    expect(component.back).toHaveBeenCalled();
  });

  it('should NOT edit the files without a .sdf or .world file', () => {
    component.world = testWorld;
    component.descriptionModified = false;
    component.tagsModified = false;
    component.fileList = [fileOther];

    spyOn(service, 'edit').and.returnValue(of(testWorld));

    component.onEdit();

    expect(service.edit).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should open a snackbar on an edit error', () => {
    component.world = testWorld;
    component.descriptionModified = false;
    component.tagsModified = false;

    spyOn(service, 'edit').and.returnValue(throwError({}));

    component.onEdit();

    expect(service.edit).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  });

  it('should open the delete dialog', () => {
    component.world = testWorld;

    spyOn(dialog, 'open').and.callThrough();

    component.onDelete();

    expect(dialog.open).toHaveBeenCalled();
  });

  it(`should go back to the world's detail page`, () => {
    component.world = testWorld;

    spyOn(router, 'navigate');
    const routeCalled = `${component.world.owner}/worlds/${component.world.name}`;

    component.back();

    expect(router.navigate).toHaveBeenCalledWith([routeCalled]);
  });
});
