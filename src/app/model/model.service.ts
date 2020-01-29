import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../auth/auth.service';
import { FuelResourceService } from '../fuel-resource';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from './model';
import { PaginatedModels } from './paginated-models';

@Injectable()

/**
 * The Model Service is in charge of making Model related requests to the Backend server.
 * It extends the abstract FuelResourceService service, setting it's resource type to Model.
 */
export class ModelService extends FuelResourceService {

  /**
   * The class of the Model resource required by the FuelResourceService.
   */
  public resourceClass = Model;

  /**
   * The class of the Paginated Models resource required by the FuelResourceService.
   */
  public paginatedResourceClass = PaginatedModels;

  /**
   * The string of the resource type, to parse the URLs of the FuelResourceService.
   */
  public resourceType: string = 'models';

  /**
   * @param authService Service to get authentication information.
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    protected authService: AuthService,
    protected factory: JsonClassFactoryService,
    protected http: HttpClient) {
    super(authService, factory, http);
  }
}
