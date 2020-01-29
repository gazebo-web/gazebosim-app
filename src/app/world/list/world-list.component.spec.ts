import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpModule } from '@angular/http';
import { MatIconModule, MatCardModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Observable } from 'rxjs/Observable';

import { AuthPipe } from '../../auth/auth.pipe';
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

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        InfiniteScrollModule,
        MatIconModule,
        MatCardModule,
        RouterTestingModule,
        HttpModule,
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorldListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the worlds from the resolved data', async(() => {
    expect(component.worlds).toBeUndefined();
    component.ngOnInit();
    expect(component.worlds).toEqual(testWorlds);
    expect(component.title).toEqual('testTitle');
  }));

  it('should load the next page', async(() => {
    const worldService = TestBed.get(WorldService);
    const spy = spyOn(worldService, 'getNextPage').and.returnValue(
      Observable.of(nextPaginatedWorlds));
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
  }));
});
