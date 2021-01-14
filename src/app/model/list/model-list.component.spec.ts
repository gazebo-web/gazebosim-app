import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AuthPipe } from '../../auth/auth.pipe';
import { AuthService } from '../../auth/auth.service';
import { CategoryService } from '../../fuel-resource/categories/category.service';
import { FuelResourceListComponent } from '../../fuel-resource';
import { ItemCardComponent } from '../../item-card/item-card.component';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { Model } from '../model';
import { ModelListComponent } from './model-list.component';
import { ModelService } from '../model.service';
import { Ng2DeviceService } from '../../device-detector';
import { PageTitleComponent } from '../../page-title';
import { PaginatedModels } from '../paginated-models';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        InfiniteScrollModule,
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
        ModelListComponent,
        PageTitleComponent,
        ],
      providers: [
        AuthService,
        CategoryService,
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

    fixture = TestBed.createComponent(ModelListComponent);
    component = fixture.componentInstance;
  });

  it('should load the the models from the resolved data', () => {
    expect(component.models).toBeUndefined();
    component.ngOnInit();
    expect(component.models).toEqual(testModels);
    expect(component.title).toEqual('testTitle');
  });

  it('should load the next page', () => {
    const modelService = TestBed.inject(ModelService);
    const spy = spyOn(modelService, 'getNextPage').and.returnValue(
      of(nextPaginatedModels));
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
  });
});
