import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../auth/auth.service';
import { FuelResourceService } from '../fuel-resource';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Model } from './model';
import { PaginatedModels } from './paginated-models';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
   * Get the first page of all the resources that belong to a user and is under review
   *
   * @param owner The owner of the resources.
   * @returns An observable of the paginated resources.
   */
  public getModelsUnderReviewList(owner: string): Observable<PaginatedModels> {
    const url = this.getModelsUnderReviewListUrl(owner);

    return this.http.get(url, {observe: 'response'}).pipe(
      map((response) => {
        const paginatedResource = new this.paginatedResourceClass();
        paginatedResource.totalCount = +response.headers.get(
          FuelResourceService.returnHeaderTotalCount());
        paginatedResource.resources = this.factory.fromJson(response.body, this.resourceClass);
        paginatedResource.nextPage = this.returnLinkHeaderParser(response);
        return paginatedResource;
      }),
      catchError(this.returnErrorHandler)
    );
  }

  /**
   * Server route of the list of resources owned by a user and is under review.
   * The route is tbc (to be implemented after checking with the backend team)
   *
   * @param owner The owner of the resources.
   * @returns The URL of the server route of the list of resources owned by the entity and is under review.
   * TODO: implement service when backend API is complete
   */
  private getModelsUnderReviewListUrl(owner: string): string {
    return ``;
  }

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
