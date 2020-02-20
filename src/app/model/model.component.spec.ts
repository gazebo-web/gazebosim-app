import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MarkdownModule } from 'ngx-markdown';
import { NgxGalleryModule } from 'ngx-gallery';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import * as FileSaver from 'file-saver';

import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';
import { CategoriesComponent } from '../fuel-resource/categories/categories.component';
import { CategoryService } from '../fuel-resource/categories/category.service';
import { CollectionService, PaginatedCollection, Collection } from '../collection';
import { CopyDialogComponent } from '../fuel-resource/copy-dialog/copy-dialog.component';
import { DescriptionComponent } from '../description/description.component';
import { FileSizePipe } from '../file-size/file-size.pipe';
import { FuelResourceListComponent } from '../fuel-resource';
import { Image } from '../model/image';
import { ItemCardComponent } from '../item-card/item-card.component';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from './model';
import { ModelComponent } from './model.component';
import { ModelService } from './model.service';
import { PageTitleComponent } from '../page-title';
import { SdfViewerComponent } from './sdfviewer/sdfviewer.component';
import { TagsComponent } from '../tags/tags.component';

import {
  MatButtonModule,
  MatCardModule,
  MatChipsModule,
  MatDialog,
  MatDialogModule,
  MatIconModule,
  MatListModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTabsModule,
} from '@angular/material';

describe('ModelComponent', () => {
  let fixture: ComponentFixture<ModelComponent>;
  let component: ModelComponent;

  // Test Model.
  const testModelJson = {
    name: 'test-model-name',
    owner: 'test-model-owner',
    description: 'test-model-description',
    downloads: 0,
    likes: 0,
    is_liked: false,
    tags: ['test-tag-1', 'test-tag-2', 'test-tag-3']
  };
  const testModel: Model = new Model(testModelJson);

  // Updated Test Model.
  const updatedTestModelJson = {
    name: 'test-model-name',
    owner: 'test-model-owner',
    description: 'test-model-description',
    downloads: 1,
    likes: 1,
    is_liked: true,
    tags: ['test-tag-1', 'test-tag-2', 'test-tag-3']
  };
  const updatedTestModel: Model = new Model(updatedTestModelJson);

  // Set images to the Test Model.
  const testImage1 = new Image();
  testImage1.url = 'test-url-1';
  const testImage2 = new Image();
  testImage2.url = `test-single-quote's-url`;
  testModel.images = [testImage1, testImage2];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        InfiniteScrollModule,
        MarkdownModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatListModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        NgxGalleryModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        AuthPipe,
        CategoriesComponent,
        CopyDialogComponent,
        DescriptionComponent,
        FileSizePipe,
        FuelResourceListComponent,
        ItemCardComponent,
        ModelComponent,
        PageTitleComponent,
        SdfViewerComponent,
        TagsComponent
        ],
      providers: [
        AuthService,
        CategoryService,
        CollectionService,
        JsonClassFactoryService,
        ModelService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: new Model({
                  name: 'test-model',
                  owner: 'test-owner',
                  version: 5,
                  images: []
                })
              },
              paramMap: new Map([
                ['modelname', 'test-model'],
                ['owner', 'test-owner'],
                ['version', '3']
              ])
            }
          }
        }
        ],
    });
    // TestBed can't have entryComponents directly. We need to set them the following way.
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ CopyDialogComponent ],
      },
    });

    // Create fixture and component before each test.
    fixture = TestBed.createComponent(ModelComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should set the model from the router data on the ngOnInit lifecycle hook', async(() => {
    spyOn(component, 'getFiles');
    spyOn(component, 'loadCollections');

    component.ngOnInit();

    expect(component.model.name).toEqual('test-model');
    expect(component.model.owner).toEqual('test-owner');
    expect(component.model.versions.length).toEqual(5);
    expect(component.latestVersion).toEqual(5);
    expect(component.currentVersion).toEqual(3);
  }));

  it('should unsubscribe from the dialog on the ngOnDestroy lifecycle hook', async(() => {
    component.collectionDialogSubscription = new Subscription();
    const spy = spyOn(component.collectionDialogSubscription, 'unsubscribe');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    spy.calls.reset();

    component.collectionDialogSubscription = undefined;
    component.ngOnDestroy();
    expect(spy).not.toHaveBeenCalled();
  }));

  it('should revoke the created ObjectURLs on the ngOnDestroy lifecycle hook', async(() => {
    component.galleryImages = [{medium: 'testUrl', small: 'testUrl'}];
    const spy = spyOn(URL, 'revokeObjectURL');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalledWith('testUrl');
    spy.calls.reset();

    component.galleryImages = undefined;
    component.ngOnDestroy();
    expect(spy).not.toHaveBeenCalled();
  }));

  it('should get the model after a download', async(() => {
    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'download').and.returnValue(Observable.of('blob'));
    spyOn(modelService, 'get').and.returnValue(Observable.of(updatedTestModel));

    spyOn(component, 'getFiles');
    spyOn(FileSaver, 'saveAs');

    component.model = testModel;
    component.downloadClick();

    expect(component.model.downloads).toEqual(1);
    expect(modelService.download).toHaveBeenCalled();
    expect(modelService.get).toHaveBeenCalled();
    expect(FileSaver.saveAs).toHaveBeenCalledWith('blob', 'test-model-name.zip');
  }));

  it('should download an individual file', async(() => {
    const testFile = new File([], 'testFile');
    testFile['path'] = '/test/file';
    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'getFileAsBlob').and.returnValue(Observable.of('blob'));
    spyOn(FileSaver, 'saveAs');

    component.model = testModel;
    component.downloadIndividualFile(testFile);

    expect(modelService.getFileAsBlob).toHaveBeenCalled();
    expect(FileSaver.saveAs).toHaveBeenCalledWith('blob', 'testFile');
  }));

  it('should open a snackbar if downloading an individual file fails', async(() => {
    const snackBar = component.snackBar;
    const testFile = new File([], 'testFile');
    testFile['path'] = '/test/file';
    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'getFileAsBlob').and.returnValue(Observable.throw({}));
    spyOn(FileSaver, 'saveAs');

    component.model = testModel;
    component.downloadIndividualFile(testFile);

    expect(FileSaver.saveAs).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should like and unlike the model', async(() => {
    const modelService = TestBed.get(ModelService);
    const likeSpy = spyOn(modelService, 'like').and.returnValue(Observable.of(1));
    const unlikeSpy = spyOn(modelService, 'unlike').and.returnValue(Observable.of(0));

    component.model = testModel;
    component.likeClick();

    expect(likeSpy).toHaveBeenCalled();
    expect(unlikeSpy).not.toHaveBeenCalled();
    expect(component.model.isLiked).toEqual(true);
    expect(component.model.likes).toEqual(1);

    // Reset the calls of each spy.
    likeSpy.calls.reset();
    unlikeSpy.calls.reset();

    component.likeClick();

    expect(likeSpy).not.toHaveBeenCalled();
    expect(unlikeSpy).toHaveBeenCalled();
    expect(component.model.isLiked).toEqual(false);
    expect(component.model.likes).toEqual(0);
  }));

  it('should return the correct tooltip of the like button', async(() => {
    const authService = TestBed.get(AuthService);
    const authSpy = spyOn(authService, 'isAuthenticated').and.returnValue(false);

    component.model = testModel;

    let title = component.getLikeButtonTitle();
    expect(title).toBe('Log in to like this model');

    authSpy.and.returnValue(true);
    title = component.getLikeButtonTitle();
    expect(title).toBe('Like this model');

    component.model.isLiked = true;
    title = component.getLikeButtonTitle();
    expect(title).toBe('Stop liking this model');
  }));

  it('should open a snackbar upon an error while liking the model', async(() => {
    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'like').and.returnValue(Observable.throw({}));

    const snackBar = component.snackBar;

    testModel.isLiked = false;
    component.model = testModel;
    component.likeClick();

    expect(modelService.like).toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should prompt the model name and owner when copying a model', async(() => {
    const dialog = TestBed.get(MatDialog);
    spyOn(dialog, 'open').and.callThrough();

    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'copy');

    // Mock the logged user.
    const authService = TestBed.get(AuthService);
    authService.userProfile = {
      username: 'testUser',
      orgs: ['testOrg']
    };

    component.model = testModel;
    component.copyModel();

    expect(dialog.open).toHaveBeenCalled();
    expect(modelService.copy).not.toHaveBeenCalled();
  }));

  it('should return the correct tooltip of the copy button', async(() => {
    const authService = TestBed.get(AuthService);
    const authSpy = spyOn(authService, 'isAuthenticated').and.returnValue(false);

    component.model = testModel;

    let title = component.getCopyButtonTitle();
    expect(title).toBe('Log in to copy this model');

    component.latestVersion = 2;
    component.currentVersion = 1;
    authSpy.and.returnValue(true);

    title = component.getCopyButtonTitle();
    expect(title).toBe('Only the latest version can be copied');

    component.currentVersion = 2;
    title = component.getCopyButtonTitle();
    expect(title).toBe('Copy this model');
  }));

  it('should notify with a snackbar if the file download fails', async(() => {
    const snackBar = component.snackBar;

    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'download').and.returnValue(Observable.throw({}));

    component.downloadClick();

    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should extract the files from the file tree', async(() => {
    const testFileTree = {
      name: 'test-name',
      file_tree: [
        {
          name: 'materials',
          path: '/materials',
          children: [
            {
              name: 'scripts',
              path: '/materials/scripts',
              children: [
                {
                  name: 'test.material',
                  path: '/materials/scripts/test.material',
                }
              ]
            },
            {
              name: 'textures',
              path: '/materials/textures',
              children: [
                {
                  name: 'test.png',
                  path: '/materials/textures/test.png',
                }
              ]
            },
          ]
        },
        {
          name: 'model.sdf',
          path: '/model.sdf',
        }
      ]
    };

    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'getFileTree').and.returnValue(Observable.of(testFileTree));
    spyOn(component, 'setupGallery');

    // For this test, spy on the Model's populateThumbnails method.
    component.model = testModel;
    spyOn(testModel, 'populateThumbnails');

    component.getFiles();

    const files = component.model.files;

    expect(files[0].name).toBe('test.material');
    expect(files[0].path).toBe('/materials/scripts/test.material');
    expect(files[0].displayPath).toBe('test-model-name > materials > scripts');

    expect(files[1].name).toBe('test.png');
    expect(files[1].path).toBe('/materials/textures/test.png');
    expect(files[1].displayPath).toBe('test-model-name > materials > textures');

    expect(files[2].name).toBe('model.sdf');
    expect(files[2].path).toBe('/model.sdf');
    expect(files[2].displayPath).toBe('test-model-name');
  }));

  it('should populate the gallery with model images', async(() => {
    component.model = testModel;
    const modelService = TestBed.get(ModelService);
    spyOn(modelService, 'getFileAsBlob').and.returnValues(Observable.of('test-url-1'),
      Observable.of(`test-single-quote's-url`));
    spyOn(URL, 'createObjectURL').and.returnValues('test-url-1', 'test-single-quote%27s-url');

    component.setupGallery();
    const galleryImages = component.galleryImages;

    expect(galleryImages[0].medium).toBe('test-url-1');
    expect(galleryImages[0].small).toBe('test-url-1');
    expect(galleryImages[1].medium).toBe(`test-single-quote%27s-url`);
    expect(galleryImages[1].small).toBe(`test-single-quote%27s-url`);
  }));

  it('should change model version', async(() => {
    const location = TestBed.get(Location);

    const spy = spyOn(component, 'getFiles');
    spyOn(component, 'loadCollections');
    spyOn(location, 'go');

    component.ngOnInit();

    expect(component.getFiles).toHaveBeenCalled();
    spy.calls.reset();

    expect(component.latestVersion).toEqual(5);
    expect(component.currentVersion).toEqual(3);

    component.currentVersion = 2;
    component.onVersion();

    expect(component.getFiles).toHaveBeenCalled();
    expect(location.go).toHaveBeenCalledWith('test-owner/models/test-model/2');
  }));

  it('should load the collections that have the model', async(() => {
    const collectionService = TestBed.get(CollectionService);
    const snackBar = component.snackBar;

    const spy = spyOn(collectionService, 'getAssetCollections').and.returnValue(Observable.of({}));
    component.loadCollections();
    expect(collectionService.getAssetCollections).toHaveBeenCalledWith(component.model);

    spy.calls.reset();
    spy.and.returnValue(Observable.throw({}));
    component.loadCollections();
    expect(collectionService.getAssetCollections).toHaveBeenCalledWith(component.model);
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it('should load the next page of the collections that have the model', async(() => {
    const collectionService = TestBed.get(CollectionService);
    const collection = new Collection({
      name: 'testCollection',
      owner: 'testOwner'
    });
    component.collections = [collection];
    component.paginatedCollections = new PaginatedCollection();
    component.paginatedCollections.collections = [collection];

    const mockCollections = new PaginatedCollection();
    mockCollections.collections = [collection];

    const spy = spyOn(collectionService, 'getNextPage').and.returnValue(
      Observable.of(mockCollections));

    component.loadNextCollections();

    expect(collectionService.getNextPage).toHaveBeenCalledWith(component.paginatedCollections);
    expect(component.paginatedCollections).toBe(mockCollections);
    expect(component.collections.length).toEqual(2);
  }));
});
