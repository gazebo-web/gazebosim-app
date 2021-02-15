import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PullRequestService } from './pull-request.service';

describe('PullRequestService', () => {
  let service: PullRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        PullRequestService,
      ],
    });

    service = TestBed.inject(PullRequestService);
  });

  it('should render properly', () => {
    expect(service).toBeTruthy();
  });
});
