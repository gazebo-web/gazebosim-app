import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { FuelResourceService } from '../fuel-resource';
import { PullRequest } from './pull-request';
import { PaginatedModels } from './paginated-models';
import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';

@Injectable()

export class PullRequestService extends FuelResourceService {

  /**
   * The class of the pull request resource required by the FuelResourceService.
   */
  public resourceClass = PullRequest;

  /**
   * The class of the Paginated pull requests resource required by the FuelResourceService.
   */
  public paginatedResourceClass = PaginatedModels;

   /**
   * The string of the resource type, to parse the URLs of the FuelResourceService.
   */
  public resourceType: string = '';

  /**
   * @param authService Service to get authentication information.
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    protected authService: AuthService,
    protected factory: JsonClassFactoryService,
    protected http: HttpClient
  ) { 
    super(authService, factory, http);
  }
}
