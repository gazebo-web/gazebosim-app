import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AuthPipe } from '../../auth/auth.pipe';
import { AuthService } from '../../auth/auth.service';
import { Collection, CollectionService, PaginatedCollection } from '../../collection';
import { CollectionListComponent } from './collection-list.component';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { PageTitleComponent } from '../../page-title';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CollectionListComponent', () => {
  let fixture: ComponentFixture<CollectionListComponent>;
  let component: CollectionListComponent;

  const testCollections: Collection[] = [
    new Collection({ name: 'testCol1', owner: 'testOwner1', description: 'testDesc1' }),
    new Collection({ name: 'testCol2', owner: 'testOwner2', description: 'testDesc2' }),
  ];

  const nextCollections: Collection[] = [
    new Collection({ name: 'testCol3', owner: 'testOwner3', description: 'testDesc3' }),
    new Collection({ name: 'testCol4', owner: 'testOwner4', description: 'testDesc4' }),
  ];

  const paginatedCollections: PaginatedCollection = new PaginatedCollection();
  paginatedCollections.collections = testCollections;
  paginatedCollections.totalCount = testCollections.length;
  paginatedCollections.nextPage = 'nextPage';

  const nextPaginatedCollections: PaginatedCollection = new PaginatedCollection();
  nextPaginatedCollections.collections = nextCollections;
  nextPaginatedCollections.totalCount = nextCollections.length;
  nextPaginatedCollections.nextPage = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AuthPipe,
        CollectionListComponent,
        FuelResourceListComponent,
        ItemCardComponent,
        PageTitleComponent,
      ],
      imports: [MatIconModule,
        MatCardModule,
        RouterTestingModule],
      providers: [
        CollectionService,
        AuthService,
        JsonClassFactoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: paginatedCollections
              },
              paramMap: convertToParamMap({
                user: '',
              })
            }
          }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ]
    });

    fixture = TestBed.createComponent(CollectionListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the collections from the resolved data', () => {
    expect(component.collections).toBeUndefined();
    component.ngOnInit();
    expect(component.collections).toEqual(testCollections);
  });

  it('should load collections on pagination', () => {
    const collectionService = TestBed.inject(CollectionService);
    const spy = spyOn(collectionService, 'getCollectionList').and.returnValue(
      of(nextPaginatedCollections));
    component.collections = testCollections;
    component.paginatedCollections = paginatedCollections;

    const mockEvent = { pageIndex: 1, pageSize: 20, length: 0 };
    component.getCollections(mockEvent);
    expect(spy).toHaveBeenCalled();
    expect(component.paginatedCollections).toEqual(nextPaginatedCollections);
    expect(component.collections).toEqual(nextCollections);
  });

  it('should set the correct title in the page', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);

    // Without an user.
    const spy = spyOn(activatedRoute.snapshot.paramMap, 'get');
    spy.withArgs('user').and.returnValue('');
    let title = component.getTitle();
    expect(title).toBe('Latest collections');

    // With an user.
    spy.calls.reset();
    spy.withArgs('user').and.returnValue('testUser');
    title = component.getTitle();
    expect(title).toBe(`testUser's collections`);
  });
});
