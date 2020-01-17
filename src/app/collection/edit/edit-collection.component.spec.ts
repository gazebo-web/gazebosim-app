import { ActivatedRoute, Router } from '@angular/router';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
  MatIconModule,
  MatInputModule,
  MatSnackBarModule,
} from '@angular/material';
import { MarkdownModule } from 'ngx-markdown';
import { Observable } from 'rxjs/Observable';

import { AuthService } from '../../auth/auth.service';
import { Collection, CollectionService } from '../../collection';
import { DescriptionComponent } from '../../description/description.component';
import { EditCollectionComponent } from './edit-collection.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';

describe('EditCollectionComponent', () => {
  let fixture: ComponentFixture<EditCollectionComponent>;
  let component: EditCollectionComponent;
  let authService: AuthService;
  let collectionService: CollectionService;
  let router: Router;

  // Test Collection
  const testCollectionJson = {
    name: 'test-col-name',
    owner: 'test-col-owner',
    description: 'test-col-description',
  };

  const testCollection = new Collection(testCollectionJson);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        MarkdownModule,
        MatIconModule,
        MatInputModule,
        MatSnackBarModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        DescriptionComponent,
        EditCollectionComponent
        ],
      providers: [
        AuthService,
        CollectionService,
        JsonClassFactoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: testCollection
              }
            }
          }
        },
        ],
    });
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(EditCollectionComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.get(AuthService);
    authService.userProfile = { orgs: [] };
    collectionService = TestBed.get(CollectionService);
    router = TestBed.get(Router);
  });

  it('should obtain the collection to edit from the route during OnInit', async(() => {
    component.ngOnInit();
    expect(component.collection).toBe(testCollection);
  }));

  it('should determine if the logged user can edit the collection', async(() => {
    // Unauthenticated
    const authSpy = spyOn(authService, 'isAuthenticated').and.returnValue(false);
    component.ngOnInit();
    expect(component.canEdit).toBe(false);

    // Different username.
    authSpy.calls.reset();
    authSpy.and.returnValue(true);
    authService.userProfile.username = 'notUser';
    component.ngOnInit();
    expect(component.canEdit).toBe(false);

    // The owner of the collection.
    authSpy.calls.reset();
    authService.userProfile.username = testCollection.owner;
    component.ngOnInit();
    expect(component.canEdit).toBe(true);

    // A member of the organization.
    authSpy.calls.reset();
    authService.userProfile.orgs = [testCollection.owner];
    component.ngOnInit();
    expect(component.canEdit).toBe(true);
  }));

  it('should receive a file', async(() => {
    const mockTarget = new EventTarget();
    const mockEvent = { target: mockTarget } as Event;
    const testFile = new File([''], 'test.png');
    mockTarget['files'] = [testFile];

    component.onFileInput(mockEvent);
    expect(component.bannerFile.name).toBe('test.png');
    expect(component.bannerFile['fullPath']).toBe('/thumbnails/test.png');
  }));

  it('should mark the description as modified', async(() => {
    component.collection = testCollection;

    component.onModifyDescription('new-description');
    expect(component.collection.description).toBe('new-description');
    expect(component.descriptionModified).toBe(true);
  }));

  it('should edit the collection given a new description', async(() => {
    const testEditedCollection = new Collection({
      name: testCollection.name,
      owner: testCollection.owner,
      description: 'new-description'
    });

    spyOn(collectionService, 'editCollection').and.returnValue(Observable.of(testEditedCollection));
    spyOn(router, 'navigate');
    const snackBar = component.snackBar;
    component.collection = testCollection;
    component.descriptionModified = true;
    const formData = new FormData();
    formData.append('description', testEditedCollection.description);

    component.onEdit();

    expect(collectionService.editCollection).toHaveBeenCalledWith(testCollection.owner,
      testCollection.name,
      formData);
    const routeCalled = `${component.collection.owner}/collections/${component.collection.name}`;
    expect(router.navigate).toHaveBeenCalledWith([routeCalled]);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should edit the collection given a new banner', async(() => {
    spyOn(collectionService, 'editCollection').and.returnValue(Observable.of(testCollection));
    spyOn(router, 'navigate');
    const snackBar = component.snackBar;
    component.collection = testCollection;
    component.bannerFile = new File([''], 'test.png');
    component.bannerFile['fullPath'] = '/thumbnails/test.png';

    const formData = new FormData();
    formData.append('file', component.bannerFile, component.bannerFile['fullPath']);

    component.onEdit();

    expect(collectionService.editCollection).toHaveBeenCalledWith(testCollection.owner,
      testCollection.name,
      formData);
    const routeCalled = `${component.collection.owner}/collections/${component.collection.name}`;
    expect(router.navigate).toHaveBeenCalledWith([routeCalled]);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should open a snackbar on an edit error', async(() => {
    spyOn(collectionService, 'editCollection').and.returnValue(
      Observable.throw({message: 'err'}));
    const snackBar = component.snackBar;
    component.collection = testCollection;
    const formData = new FormData();

    component.onEdit();

    expect(collectionService.editCollection).toHaveBeenCalledWith(testCollection.owner,
      testCollection.name,
      formData);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
    expect(snackBar._openedSnackBarRef.instance.data.message).toBe('err');
  }));

  it(`should go back to the collection page`, async(() => {
    component.collection = testCollection;
    spyOn(router, 'navigate');

    component.back();
    const routeCalled = `${component.collection.owner}/collections/${component.collection.name}`;
    expect(router.navigate).toHaveBeenCalledWith([routeCalled]);
  }));
});
