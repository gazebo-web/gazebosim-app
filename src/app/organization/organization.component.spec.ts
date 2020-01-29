import { ActivatedRoute } from '@angular/router';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpModule } from '@angular/http';

import {
  MatCardModule,
  MatChipsModule,
  MatDialog,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTabsModule
} from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Observable } from 'rxjs/Observable';

import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';
import {
  ConfirmationDialogComponent
} from '../confirmation-dialog/confirmation-dialog.component';
import { Collection, CollectionService, PaginatedCollection } from '../collection';
import { FuelResourceListComponent } from '../fuel-resource';
import { ItemCardComponent } from '../item-card/item-card.component';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { Organization } from './organization';
import { OrganizationComponent } from './organization.component';
import { OrganizationService } from './organization.service';
import { PageTitleComponent } from '../page-title';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';

describe('OrganizationComponent', () => {
  let fixture: ComponentFixture<OrganizationComponent>;
  let component: OrganizationComponent;
  let authService: AuthService;
  let collectionService: CollectionService;
  let dialog: MatDialog;
  let modelService: ModelService;
  let organizationService: OrganizationService;
  let worldService: WorldService;

  // Test Organization.
  const testOrganization: Organization = new Organization({name: 'testOrg'});

  // Test Organization Models.
  const testModels: PaginatedModels = new PaginatedModels();
  testModels.resources = [
    new Model({name: 'testModel0'}),
    new Model({name: 'testModel1'}),
  ];
  testModels.totalCount = testModels.resources.length;

  // Test Organization Worlds.
  const testWorlds: PaginatedWorlds = new PaginatedWorlds();
  testWorlds.resources = [
    new World({name: 'testWorld0'}),
    new World({name: 'testWorld1'}),
  ];
  testWorlds.totalCount = testWorlds.resources.length;

  // Test Organization Collections.
  const testCollections: PaginatedCollection = new PaginatedCollection();
  testCollections.collections = [
    new Collection({name: 'testCol0', owner: 'testOrg'}),
    new Collection({name: 'testCol1', owner: 'testOrg'}),
  ];
  testCollections.totalCount = testCollections.collections.length;

  // Test Organization Users.
  const testUsers = [
    {
      name: 'Test User A',
      username: 'testUserA',
      orgRoles: {}
    },
    {
      name: 'Test User B',
      username: 'testUserB',
      orgRoles: {}
    }
  ];
  testUsers[0].orgRoles[testOrganization.name] = 'member';
  testUsers[1].orgRoles[testOrganization.name] = 'owner';

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        HttpClientTestingModule,
        HttpModule,
        InfiniteScrollModule,
        MatCardModule,
        MatChipsModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTabsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        ],
      declarations: [
        AuthPipe,
        ConfirmationDialogComponent,
        FuelResourceListComponent,
        ItemCardComponent,
        OrganizationComponent,
        PageTitleComponent,
        ],
      providers: [
        AuthService,
        CollectionService,
        JsonClassFactoryService,
        ModelService,
        OrganizationService,
        WorldService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: new Organization({
                  name: 'testOrgName',
                  description: 'testOrgDesc'
                })
              },
            }
          }
        }
        ],
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ ConfirmationDialogComponent ],
      },
    });
  }));

  // Create fixture and component before each test.
  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationComponent);
    component = fixture.debugElement.componentInstance;
    authService = TestBed.get(AuthService);
    collectionService = TestBed.get(CollectionService);
    dialog = TestBed.get(MatDialog);
    modelService = TestBed.get(ModelService);
    organizationService = TestBed.get(OrganizationService);
    worldService = TestBed.get(WorldService);
  });

  it('should get the organization from the resolved data', async(() => {
    spyOn(modelService, 'getOwnerList').and.callThrough();
    spyOn(worldService, 'getOwnerList').and.callThrough();
    spyOn(organizationService, 'getOrganizationUsers').and.callThrough();

    component.ngOnInit();

    expect(component.organization.name).toBe('testOrgName');
    expect(component.organization.description).toBe('testOrgDesc');
    expect(modelService.getOwnerList).toHaveBeenCalledWith('testOrgName');
    expect(worldService.getOwnerList).toHaveBeenCalledWith('testOrgName');
    expect(organizationService.getOrganizationUsers).toHaveBeenCalledWith(component.organization);
  }));

  it(`should get the organization's models on the OnInit lifecycle hook`, async(() => {
    const snackBar = component.snackBar;
    const spy = spyOn(modelService, 'getOwnerList');

    // Test failure.
    spy.and.returnValue(Observable.throw({}));
    component.ngOnInit();
    expect(component.models).toBeUndefined();
    expect(component.paginatedModels).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(Observable.of(testModels));
    component.ngOnInit();
    expect(component.models).toBe(testModels.resources);
    expect(component.paginatedModels).toEqual(testModels);
    expect(component.paginatedModels.totalCount).toBe(testModels.totalCount);
  }));

  it(`should get the organization's worlds on the OnInit lifecycle hook`, async(() => {
    const snackBar = component.snackBar;
    const spy = spyOn(worldService, 'getOwnerList');

    // Test failure.
    spy.and.returnValue(Observable.throw({}));
    component.ngOnInit();
    expect(component.worlds).toBeUndefined();
    expect(component.paginatedWorlds).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(Observable.of(testWorlds));
    component.ngOnInit();
    expect(component.worlds).toBe(testWorlds.resources);
    expect(component.paginatedWorlds).toEqual(testWorlds);
    expect(component.paginatedWorlds.totalCount).toBe(testWorlds.totalCount);
  }));

  it(`should get the organization's collections on the OnInit lifecycle hook`, async(() => {
    const snackBar = component.snackBar;
    const spy = spyOn(collectionService, 'getOwnerCollectionList');

    // Test failure.
    spy.and.returnValue(Observable.throw({}));
    component.ngOnInit();
    expect(component.collections).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(Observable.of(testCollections));
    component.ngOnInit();
    expect(component.collections).toEqual(testCollections.collections);
    expect(component.paginatedCollections).toEqual(testCollections);
    expect(component.paginatedCollections.totalCount).toBe(testCollections.totalCount);
  }));

  it(`should get the organization's users on the OnInit lifecycle hook`, async(() => {
    const snackBar = component.snackBar;
    const spy = spyOn(organizationService, 'getOrganizationUsers');

    // Test failure.
    spy.and.returnValue(Observable.throw({}));
    component.ngOnInit();
    expect(component.users).toBeUndefined();
    expect(snackBar._openedSnackBarRef).toBeTruthy();

    // Test correct case.
    spy.calls.reset();
    spy.and.returnValue(Observable.of(testUsers));
    component.ngOnInit();
    expect(component.users).toEqual(testUsers);
  }));

  it(`should load the next page of models`, async(() => {
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
    spyGetNextUrl.and.returnValue(Observable.of(testModels));
    component.loadNextModelsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testModels);
    expect(component.models.length).toBe(2);
    expect(component.models[0].name).toBe(testModels.resources[0].name);
    expect(component.models[1].name).toBe(testModels.resources[1].name);
  }));

  it(`should load the next page of worlds`, async(() => {
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
    spyGetNextUrl.and.returnValue(Observable.of(testWorlds));
    component.loadNextWorldsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testWorlds);
    expect(component.worlds.length).toBe(2);
    expect(component.worlds[0].name).toBe(testWorlds.resources[0].name);
    expect(component.worlds[1].name).toBe(testWorlds.resources[1].name);
  }));

  it(`should load the next page of collections`, async(() => {
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
    spyGetNextUrl.and.returnValue(Observable.of(testCollections));
    component.loadNextCollectionsPage();
    expect(spyGetNextUrl).toHaveBeenCalledWith(testCollections);
    expect(component.collections.length).toBe(2);
    expect(component.collections[0].name).toBe(testCollections.collections[0].name);
    expect(component.collections[1].name).toBe(testCollections.collections[1].name);
  }));

  it(`should NOT add a new user if the username is empty`, async(() => {
    const snackBar = component.snackBar;
    spyOn(organizationService, 'addUserToOrganization');

    component.usernameInputForm.setValue('');
    component.addUser();

    expect(organizationService.addUserToOrganization).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it(`should NOT add a new user if the role is empty`, async(() => {
    const snackBar = component.snackBar;
    spyOn(organizationService, 'addUserToOrganization');

    component.usernameInputForm.setValue('correct');
    component.roleDropdownForm.setValue('');
    component.addUser();

    expect(organizationService.addUserToOrganization).not.toHaveBeenCalled();
    expect(snackBar._openedSnackBarRef).toBeTruthy();
  }));

  it(`should add a new user if the fields are correct`, async(() => {
    const snackBar = component.snackBar;
    spyOn(organizationService, 'addUserToOrganization').and.returnValue(Observable.of({}));

    component.organization = testOrganization;
    component.users = [];
    component.usernameInputForm.setValue('correct');
    component.roleDropdownForm.setValue('Member');
    component.addUser();

    expect(organizationService.addUserToOrganization).toHaveBeenCalled();
    expect(component.users.length).toBe(1);
    expect(snackBar._openedSnackBarRef).toBeNull();
  }));

  it(`should open the user remove dialog`, async(() => {
    const confirmationDialog = component.dialog;
    component.users = testUsers;
    component.organization = testOrganization;

    const dialogSpy = spyOn(confirmationDialog, 'open').and.callThrough();

    // Leave the Organization.
    // Mock the logged in user.
    component.authService.userProfile = testUsers[0];
    const mockDialogOps = {
      data: {
        title: `Remove from Organization`,
        message: `You are about to leave the ${testOrganization.name} organization.` +
        ` Are you sure?`,
        buttonText: `Leave`
      }
    };
    component.removeUser(testUsers[0]);
    expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, mockDialogOps);

    // Remove a user.
    dialogSpy.calls.reset();
    mockDialogOps.data.message = `You are about to remove the user ${testUsers[1].username}` +
      ` from the ${testOrganization.name} organization. Are you sure?`;
    mockDialogOps.data.buttonText = `Remove`;
    component.removeUser(testUsers[1]);
    expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialogComponent, mockDialogOps);
  }));

  it(`should disable the remove button for owners`, async(() => {
    component.users = testUsers;
    component.organization = testOrganization;
    let shouldDisable: boolean;

    // Don't disable the button for a member.
    shouldDisable = component.disableRemoveButton(testUsers[0]);
    expect(shouldDisable).toBe(false);
    // Disable the button for a owner.
    shouldDisable = component.disableRemoveButton(testUsers[1]);
    expect(shouldDisable).toBe(true);
  }));

  it(`should return the correct tooltip if the remove button is disabled`, async(() => {
    component.users = testUsers;
    component.organization = testOrganization;
    component.authService.userProfile = testUsers[0];
    const disableSpy = spyOn(component, 'disableRemoveButton');
    let tooltip: string;

    // Enabled button.
    disableSpy.and.returnValue(false);
    tooltip = component.getRemoveButtonTooltip(testUsers[0]);
    expect(tooltip).toBe('');

    // Disabled button.
    disableSpy.and.returnValue(true);

    // Logged user is the one to remove.
    tooltip = component.getRemoveButtonTooltip(testUsers[0]);
    expect(tooltip).toBe(`You can't leave the organization.`);

    // Logged user is not the one to remove.
    tooltip = component.getRemoveButtonTooltip(testUsers[1]);
    expect(tooltip).toBe(`This user can't be removed.`);
  }));

  it(`should label the remove button correctly`, async(() => {
    component.users = testUsers;
    component.organization = testOrganization;
    component.authService.userProfile = testUsers[0];
    let label: string;

    // Logged user is the one to remove.
    label = component.getRemoveButtonLabel(testUsers[0]);
    expect(label).toBe('Leave');

    // Logged user is not the one to remove.
    label = component.getRemoveButtonLabel(testUsers[1]);
    expect(label).toBe('Remove');
  }));

  it(`should change the active tab`, async(() => {
    // Start showing models.
    expect(component.activeTab).toBe('models');

    component.setActiveTab(1);
    expect(component.activeTab).toBe('worlds');
    component.setActiveTab(2);
    expect(component.activeTab).toBe('users');
    component.setActiveTab(3);
    expect(component.activeTab).toBe('collections');
    component.setActiveTab(0);
    expect(component.activeTab).toBe('models');
  }));
});
