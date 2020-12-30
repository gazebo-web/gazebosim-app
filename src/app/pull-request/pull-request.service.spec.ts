import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { PullRequestService } from './pull-request.service';
import { PullRequest } from './pull-request';
import { PaginatedModels } from './paginated-models';

describe('PullRequestService', () => {
  let service: PullRequestService;
  let auth: AuthService;
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
        PullRequestService,
      ],
    });

    auth = TestBed.inject(AuthService);
    service = TestBed.inject(PullRequestService);
    factory = TestBed.inject(JsonClassFactoryService);
  });

  it('should have the resource type and classes set', () => {
    expect(service.resourceType).toBe('');
    expect(service.resourceClass).toBe(PullRequest);
    expect(service.paginatedResourceClass).toBe(PaginatedModels);
  });
});
