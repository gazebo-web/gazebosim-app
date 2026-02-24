import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from './model';
import { ModelService } from './model.service';
import { PaginatedModels } from './paginated-models';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ModelService', () => {
  let auth: AuthService;
  let service: ModelService;
  let factory: JsonClassFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [RouterTestingModule],
    providers: [
        AuthService,
        JsonClassFactoryService,
        ModelService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

    auth = TestBed.inject(AuthService);
    service = TestBed.inject(ModelService);
    factory = TestBed.inject(JsonClassFactoryService);
  });

  it('should have the resource type and classes set', () => {
    expect(service.resourceType).toBe('models');
    expect(service.resourceClass).toBe(Model);
    expect(service.paginatedResourceClass).toBe(PaginatedModels);
  });
});
