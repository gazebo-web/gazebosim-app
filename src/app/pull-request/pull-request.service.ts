import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()

export class PullRequestService {

  /**
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    protected http: HttpClient
  ) {
  }
}
