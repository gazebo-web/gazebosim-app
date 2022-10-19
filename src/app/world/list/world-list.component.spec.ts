import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { AuthPipe } from '../../auth/auth.pipe';
import { CategoryService } from '../../fuel-resource/categories/category.service';
import { AuthService } from '../../auth/auth.service';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Ng2DeviceService } from '../../device-detector';
import { PageTitleComponent } from '../../page-title';
import { PaginatedWorlds } from '../paginated-worlds';
import { World } from '../world';
import { WorldListComponent } from './world-list.component';
import { WorldService } from '../world.service';

describe('WorldListComponent', () => {
  let fixture: ComponentFixture<WorldListComponent>;
  let component: WorldListComponent;

  const testWorlds: World[] = [
    new World({name: 'testWorld0'}),
    new World({name: 'testWorld1'})
  ];

  const nextWorlds: World[] = [
    new World({name: 'testWorld2'}),
    new World({name: 'testWorld3'})
  ];

  const paginatedWorlds: PaginatedWorlds = new PaginatedWorlds();
  paginatedWorlds.resources = testWorlds;
  paginatedWorlds.totalCount = testWorlds.length;
  paginatedWorlds.nextPage = 'nextPage';

  const nextPaginatedWorlds: PaginatedWorlds = new PaginatedWorlds();
  nextPaginatedWorlds.resources = nextWorlds;
  nextPaginatedWorlds.totalCount = nextWorlds.length;
  nextPaginatedWorlds.nextPage = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatCardModule,
        MatInputModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ],
      declarations: [
        AuthPipe,
        FuelResourceListComponent,
        ItemCardComponent,
        PageTitleComponent,
        WorldListComponent,
        ],
      providers: [
        AuthService,
        CategoryService,
        WorldService,
        Ng2DeviceService,
        JsonClassFactoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: paginatedWorlds,
                title: () => {
                  return 'testTitle';
                }
              }
            }
          }
        },
        ],
    });

    fixture = TestBed.createComponent(WorldListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the worlds from the resolved data', () => {
    expect(component.worlds).toBeUndefined();
    component.ngOnInit();
    expect(component.worlds).toEqual(testWorlds);
    expect(component.title).toEqual('testTitle');
  });

  it('should load the next page', () => {
    const worldService = TestBed.inject(WorldService);
    const spy = spyOn(worldService, 'getNextPage').and.returnValue(
      of(nextPaginatedWorlds));
    component.worlds = [];
    component.paginatedWorlds = paginatedWorlds;

    // Consider the paginated worlds have a next page.
    paginatedWorlds.nextPage = 'hasNextPage';
    component.loadNextPage();
    expect(spy).toHaveBeenCalledWith(paginatedWorlds);
    expect(component.paginatedWorlds).toEqual(nextPaginatedWorlds);
    expect(component.worlds).toEqual(nextWorlds);
    expect(component.paginatedWorlds.hasNextPage()).toBe(false);

    // There is no next page.
    spy.calls.reset();
    component.loadNextPage();
    expect(spy).not.toHaveBeenCalled();
  });
});
