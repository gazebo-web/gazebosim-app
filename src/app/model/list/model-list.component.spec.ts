import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpModule } from '@angular/http';
import { MatIconModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatOptionModule } from '@angular/material';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Observable } from 'rxjs/Observable';

import { AuthPipe } from '../../auth/auth.pipe';
import { AuthService } from '../../auth/auth.service';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Model } from '../model';
import { ModelListComponent } from './model-list.component';
import { ModelService } from '../model.service';
import { Ng2DeviceService } from '../../device-detector';
import { PageTitleComponent } from '../../page-title';
import { PaginatedModels } from '../paginated-models';
import { SearchbarComponent } from '../../searchbar/searchbar.component';

describe('ModelListComponent', () => {
  let fixture: ComponentFixture<ModelListComponent>;
  let component: ModelListComponent;

  const testModels: Model[] = [
    new Model({name: 'testModel0'}),
    new Model({name: 'testModel1'})
  ];

  const nextModels: Model[] = [
    new Model({name: 'testModel2'}),
    new Model({name: 'testModel3'})
  ];

  const paginatedModels: PaginatedModels = new PaginatedModels();
  paginatedModels.resources = testModels;
  paginatedModels.totalCount = testModels.length;
  paginatedModels.nextPage = 'nextPage';

  const nextPaginatedModels: PaginatedModels = new PaginatedModels();
  nextPaginatedModels.resources = nextModels;
  nextPaginatedModels.totalCount = nextModels.length;
  nextPaginatedModels.nextPage = null;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        InfiniteScrollModule,
        MatCardModule,
        MatInputModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        RouterTestingModule,
        HttpModule,
        HttpClientTestingModule,
        ],
      declarations: [
        AuthPipe,
        FuelResourceListComponent,
        ItemCardComponent,
        ModelListComponent,
        PageTitleComponent,
        SearchbarComponent,
        ],
      providers: [
        AuthService,
        ModelService,
        Ng2DeviceService,
        JsonClassFactoryService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                resolvedData: paginatedModels,
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
    fixture = TestBed.createComponent(ModelListComponent);
    component = fixture.debugElement.componentInstance;
  });

  it('should load the the models from the resolved data', async(() => {
    expect(component.models).toBeUndefined();
    component.ngOnInit();
    expect(component.models).toEqual(testModels);
    expect(component.title).toEqual('testTitle');
  }));

  it('should load the next page', async(() => {
    const modelService = TestBed.get(ModelService);
    const spy = spyOn(modelService, 'getNextPage').and.returnValue(
      Observable.of(nextPaginatedModels));
    component.models = [];
    component.paginatedModels = paginatedModels;

    // Consider the paginated models have a next page.
    paginatedModels.nextPage = 'hasNextPage';
    component.loadNextPage();
    expect(spy).toHaveBeenCalledWith(paginatedModels);
    expect(component.paginatedModels).toEqual(nextPaginatedModels);
    expect(component.models).toEqual(nextModels);
    expect(component.paginatedModels.hasNextPage()).toBe(false);

    // There is no next page.
    spy.calls.reset();
    component.loadNextPage();
    expect(spy).not.toHaveBeenCalled();
  }));
});
