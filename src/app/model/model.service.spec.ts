import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from './model';
import { ModelService } from './model.service';
import { PaginatedModels } from './paginated-models';

describe('ModelService', () => {
  let injector: TestBed;
  let auth: AuthService;
  let service: ModelService;
  let factory: JsonClassFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        ModelService,
      ],
    });

    injector = getTestBed();
    auth = injector.get(AuthService);
    service = injector.get(ModelService);
    factory = injector.get(JsonClassFactoryService);
  });

  it('should have the resource type and classes set', () => {
    expect(service.resourceType).toBe('models');
    expect(service.resourceClass).toBe(Model);
    expect(service.paginatedResourceClass).toBe(PaginatedModels);
  });
});
