import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { World } from './world';
import { WorldService } from './world.service';
import { PaginatedWorlds } from './paginated-worlds';

describe('WorldService', () => {
  let injector: TestBed;
  let auth: AuthService;
  let service: WorldService;
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
        WorldService,
      ],
    });

    injector = getTestBed();
    auth = injector.get(AuthService);
    service = injector.get(WorldService);
    factory = injector.get(JsonClassFactoryService);
  });

  it('should have the resource type and classes set', () => {
    expect(service.resourceType).toBe('worlds');
    expect(service.resourceClass).toBe(World);
    expect(service.paginatedResourceClass).toBe(PaginatedWorlds);
  });
});
