import { TestBed } from '@angular/core/testing';

import { PullRequestService } from './pull-request.service';

describe('PullRequestService', () => {
  let service: PullRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PullRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
