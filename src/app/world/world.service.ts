import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../auth/auth.service';
import { FuelResourceService } from '../fuel-resource';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { PaginatedWorlds } from './paginated-worlds';
import { World } from './world';

@Injectable({
  providedIn: 'root',
})

/**
 * The World Service is in charge of making World related requests to the Backend server.
 * It extends the abstract FuelResourceService service, setting it's resource type to World.
 */
export class WorldService extends FuelResourceService {

  /**
   * The class of the World resource required by the FuelResourceService.
   */
  public resourceClass = World;

  /**
   * The class of the Paginated Worlds resource required by the FuelResourceService.
   */
  public paginatedResourceClass = PaginatedWorlds;

  /**
   * The string of the resource type, to parse the URLs of the FuelResourceService.
   */
  public resourceType: string = 'worlds';

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
