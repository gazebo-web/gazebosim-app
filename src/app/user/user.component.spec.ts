import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { of, throwError } from 'rxjs';

import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';
import { Collection, CollectionService, PaginatedCollection } from '../collection';
import { FuelResourceListComponent } from '../fuel-resource';
import { ItemCardComponent } from '../item-card/item-card.component';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { PageTitleComponent } from '../page-title';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { User } from './user';
import { UserComponent } from './user.component';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';

describe('UserComponent', () => {
  let fixture: ComponentFixture<UserComponent>;
  let component: UserComponent;
  let collectionService: CollectionService;
  let modelService: ModelService;
  let worldService: WorldService;

  // Test User.
  const testUser: User = new User({
    name: 'A Test User',
    username: 'testUser',
  });

  // Test User Models.
  const testModels: PaginatedModels = new PaginatedModels();
  testModels.resources = [
    new Model({name: 'testModel0'}),
    new Model({name: 'testModel1'}),
  ];
  testModels.totalCount = testModels.resources.length;

  // Test User Worlds.
  const testWorlds: PaginatedWorlds = new PaginatedWorlds();
  testWorlds.resources = [
    new World({name: 'testWorld0'}),
    new World({name: 'testWorld1'}),
  ];
  testWorlds.totalCount = testWorlds.resources.length;

  // Test User Collections.
  const testCollections: PaginatedCollection = new PaginatedCollection();
  testCollections.collections = [
    new Collection({name: 'testCol0', owner: testUser.name}),
    new Collection({name: 'testCol1', owner: testUser.name}),
  ];
  testCollections.totalCount = testCollections.collections.length;

  // Create fixture and component before each test.
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        HttpClientTestingModule,
        InfiniteScrollModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule,
        MatTabsModule,
        RouterTestingModule,
        ],
      declarations: [
        AuthPipe,
        FuelResourceListComponent,
        ItemCardComponent,
        PageTitleComponent,
        UserComponent,
        ],
      providers: [
        AuthService,
        CollectionService,
        JsonClassFactoryService,
        ModelService,
        WorldService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: new User({
                  username: 'testUser',
                  name: 'A Test User'
                })
              },
            }
          }
        }
        ],
    });

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.debugElement.componentInstance;
    collectionService = TestBed.inject(CollectionService);
    modelService = TestBed.inject(ModelService);
    worldService = TestBed.inject(WorldService);
  });

  it('should get the organization from the resolved data', () => {
    spyOn(modelService, 'getOwnerList').and.callThrough();
    spyOn(worldService, 'getOwnerList').and.callThrough();
    spyOn(modelService, 'getUserLikedList').and.callThrough();
    spyOn(worldService, 'getUserLikedList').and.callThrough();
    spyOn(collectionService, 'getOwnerCollectionList').and.callThrough();

    component.ngOnInit();

    expect(component.user.username).toBe('testUser');
    expect(component.user.name).toBe('A Test User');
    expect(modelService.getOwnerList).toHaveBeenCalledWith('testUser');
    expect(worldService.getOwnerList).toHaveBeenCalledWith('testUser');
    expect(modelService.getUserLikedList).toHaveBeenCalledWith('testUser');
    expect(worldService.getUserLikedList).toHaveBeenCalledWith('testUser');
    expect(collectionService.getOwnerCollectionList).toHaveBeenCalledWith('testUser');
  });

  it(`should get the user's models on the OnInit lifecycle hook`, () => {
    const snackBar = component.snackBar;
    const spy = spyOn(modelService, 'getOwnerList');

    // Test failure.
    spy.and.returnValue(throwError({}));
    component.ngOnInit();
    expect(component.models).toBeUndefined();
    expect(component.paginatedModels).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(of(testModels));
    component.ngOnInit();
    expect(component.models).toBe(testModels.resources);
    expect(component.paginatedModels).toBe(testModels);
    expect(component.paginatedModels.totalCount).toBe(testModels.totalCount);
  });

  it(`should get the user's liked models on the OnInit lifecycle hook`, () => {
    const snackBar = component.snackBar;
    const spy = spyOn(modelService, 'getUserLikedList');

    // Test failure.
    spy.and.returnValue(throwError({}));
    component.ngOnInit();
    expect(component.modelsLiked).toBeUndefined();
    expect(component.paginatedLikedModels).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(of(testModels));
    component.ngOnInit();
    expect(component.modelsLiked).toBe(testModels.resources);
    expect(component.paginatedLikedModels).toBe(testModels);
    expect(component.paginatedLikedModels.totalCount).toBe(testModels.totalCount);
  });

  it(`should get the user's worlds on the OnInit lifecycle hook`, () => {
    const snackBar = component.snackBar;
    const spy = spyOn(worldService, 'getOwnerList');

    // Test failure.
    spy.and.returnValue(throwError({}));
    component.ngOnInit();
    expect(component.worlds).toBeUndefined();
    expect(component.paginatedWorlds).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(of(testWorlds));
    component.ngOnInit();
    expect(component.worlds).toBe(testWorlds.resources);
    expect(component.paginatedWorlds).toBe(testWorlds);
    expect(component.paginatedWorlds.totalCount).toBe(testWorlds.totalCount);
  });

  it(`should get the user's liked worlds on the OnInit lifecycle hook`, () => {
    const snackBar = component.snackBar;
    const spy = spyOn(worldService, 'getUserLikedList');

    // Test failure.
    spy.and.returnValue(throwError({}));
    component.ngOnInit();
    expect(component.worldsLiked).toBeUndefined();
    expect(component.paginatedLikedWorlds).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(of(testWorlds));
    component.ngOnInit();
    expect(component.worldsLiked).toBe(testWorlds.resources);
    expect(component.paginatedLikedWorlds).toBe(testWorlds);
    expect(component.paginatedLikedWorlds.totalCount).toBe(testWorlds.totalCount);
  });

  it(`should get the user's collections on the OnInit lifecycle hook`, () => {
    const snackBar = component.snackBar;
    const spy = spyOn(collectionService, 'getOwnerCollectionList');

    // Test failure.
    spy.and.returnValue(throwError({}));
    component.ngOnInit();
    expect(component.collections).toBeUndefined();
    expect(component.paginatedCollections).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(of(testCollections));
    component.ngOnInit();
    expect(component.collections).toBe(testCollections.collections);
    expect(component.paginatedCollections).toBe(testCollections);
    expect(component.paginatedCollections.totalCount).toBe(testCollections.totalCount);
  });

  it(`should load the next page of models`, () => {
    component.models = [];
    component.paginatedModels = testModels;
    const spyGetNextUrl = spyOn(modelService, 'getNextPage');

    // Without a next page.
    component.paginatedModels.nextPage = null;
    component.loadNextModelsPage();
    expect(component.models.length).toBe(0);
    expect(spyGetNextUrl).not.toHaveBeenCalled();

    // Has a next page.
    component.paginatedModels.nextPage = 'testNextPage';
    spyGetNextUrl.and.returnValue(of(testModels));
    component.loadNextModelsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testModels);
    expect(component.models.length).toBe(2);
    expect(component.models[0].name).toBe(testModels.resources[0].name);
    expect(component.models[1].name).toBe(testModels.resources[1].name);
  });

  it(`should load the next page of liked models`, () => {
    component.modelsLiked = [];
    component.paginatedLikedModels = testModels;
    const spyGetNextUrl = spyOn(modelService, 'getNextPage');

    // Without a next page.
    component.paginatedLikedModels.nextPage = null;
    component.loadNextLikedModelsPage();
    expect(component.modelsLiked.length).toBe(0);
    expect(spyGetNextUrl).not.toHaveBeenCalled();

    // Has a next page.
    component.paginatedLikedModels.nextPage = 'testNextPage';
    spyGetNextUrl.and.returnValue(of(testModels));
    component.loadNextLikedModelsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testModels);
    expect(component.modelsLiked.length).toBe(2);
    expect(component.modelsLiked[0].name).toBe(testModels.resources[0].name);
    expect(component.modelsLiked[1].name).toBe(testModels.resources[1].name);
  });

  it(`should load the next page of worlds`, () => {
    component.worlds = [];
    component.paginatedWorlds = testWorlds;
    const spyGetNextUrl = spyOn(worldService, 'getNextPage');

    // Without a next page.
    component.paginatedWorlds.nextPage = null;
    component.loadNextWorldsPage();
    expect(component.worlds.length).toBe(0);
    expect(spyGetNextUrl).not.toHaveBeenCalled();

    // Has a next page.
    component.paginatedWorlds.nextPage = 'testNextPage';
    spyGetNextUrl.and.returnValue(of(testWorlds));
    component.loadNextWorldsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testWorlds);
    expect(component.worlds.length).toBe(2);
    expect(component.worlds[0].name).toBe(testWorlds.resources[0].name);
    expect(component.worlds[1].name).toBe(testWorlds.resources[1].name);
  });

  it(`should load the next page of liked worlds`, () => {
    component.worldsLiked = [];
    component.paginatedLikedWorlds = testWorlds;
    const spyGetNextUrl = spyOn(worldService, 'getNextPage');

    // Without a next page.
    component.paginatedLikedWorlds.nextPage = null;
    component.loadNextLikedWorldsPage();
    expect(component.worldsLiked.length).toBe(0);
    expect(spyGetNextUrl).not.toHaveBeenCalled();

    // Has a next page.
    component.paginatedLikedWorlds.nextPage = 'testNextPage';
    spyGetNextUrl.and.returnValue(of(testWorlds));
    component.loadNextLikedWorldsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testWorlds);
    expect(component.worldsLiked.length).toBe(2);
    expect(component.worldsLiked[0].name).toBe(testWorlds.resources[0].name);
    expect(component.worldsLiked[1].name).toBe(testWorlds.resources[1].name);
  });

  it(`should load the next page of collections`, () => {
    component.collections = [];
    component.paginatedCollections = testCollections;
    const spyGetNextUrl = spyOn(collectionService, 'getNextPage');

    // Without a next page.
    component.paginatedCollections.nextPage = null;
    component.loadNextCollectionsPage();
    expect(component.collections.length).toBe(0);
    expect(spyGetNextUrl).not.toHaveBeenCalled();

    // Has a next page.
    component.paginatedCollections.nextPage = 'testNextPage';
    spyGetNextUrl.and.returnValue(of(testCollections));
    component.loadNextCollectionsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testCollections);
    expect(component.collections.length).toBe(2);
    expect(component.collections[0].name).toBe(testCollections.collections[0].name);
    expect(component.collections[1].name).toBe(testCollections.collections[1].name);
  });

  it(`should change the active tab`, () => {
    // Start showing models.
    expect(component.activeTab).toBe('models');

    component.setActiveTab(1);
    expect(component.activeTab).toBe('modelsUnderReview');
    component.setActiveTab(2);
    expect(component.activeTab).toBe('modelsLiked');
    component.setActiveTab(3);
    expect(component.activeTab).toBe('worlds');
    component.setActiveTab(4);
    expect(component.activeTab).toBe('worldsLiked');
    component.setActiveTab(5);
    expect(component.activeTab).toBe('collections');
    component.setActiveTab(0);
    expect(component.activeTab).toBe('models');
  });
});
