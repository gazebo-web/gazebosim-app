import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AuthPipe } from '../../auth/auth.pipe';
import { AuthService } from '../../auth/auth.service';
import { Collection, CollectionService, PaginatedCollection } from '../../collection';
import { CollectionListComponent } from './collection-list.component';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { PageTitleComponent } from '../../page-title';

describe('CollectionListComponent', () => {
  let fixture: ComponentFixture<CollectionListComponent>;
  let component: CollectionListComponent;

  const testCollections: Collection[] = [
    new Collection({name: 'testCol1', owner: 'testOwner1', description: 'testDesc1'}),
    new Collection({name: 'testCol2', owner: 'testOwner2', description: 'testDesc2'}),
  ];

  const nextCollections: Collection[] = [
    new Collection({name: 'testCol3', owner: 'testOwner3', description: 'testDesc3'}),
    new Collection({name: 'testCol4', owner: 'testOwner4', description: 'testDesc4'}),
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
      imports: [
        InfiniteScrollModule,
        MatIconModule,
        MatCardModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ],
      declarations: [
        AuthPipe,
        CollectionListComponent,
        FuelResourceListComponent,
        ItemCardComponent,
        PageTitleComponent,
        ],
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
        ],
    });

    fixture = TestBed.createComponent(CollectionListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the collections from the resolved data', () => {
    expect(component.collections).toBeUndefined();
    component.ngOnInit();
    expect(component.collections).toEqual(testCollections);
  });

  it('should load the next page', () => {
    const collectionService = TestBed.inject(CollectionService);
    const spy = spyOn(collectionService, 'getNextPage').and.returnValue(
      of(nextPaginatedCollections));
    component.collections = [];
    component.paginatedCollections = paginatedCollections;

    // Consider the paginated models have a next page.
    paginatedCollections.nextPage = 'hasNextPage';
    component.loadNextCollectionsPage();
    expect(spy).toHaveBeenCalledWith(paginatedCollections);
    expect(component.paginatedCollections).toEqual(nextPaginatedCollections);
    expect(component.collections).toEqual(nextCollections);
    expect(component.paginatedCollections.hasNextPage()).toBe(false);

    // There is no next page.
    spy.calls.reset();
    component.loadNextCollectionsPage();
    expect(spy).not.toHaveBeenCalled();
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
