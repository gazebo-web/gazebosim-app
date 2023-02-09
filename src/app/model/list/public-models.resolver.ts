import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PaginatedModels } from '../paginated-models';
import { ModelService } from '../model.service';

@Injectable()

/**
 * Resolver that fetches all public models.
 *
 * This allows us to have the list of models before it's displayed in a Component.
 */
export class PublicModelsResolver implements Resolve<PaginatedModels> {

  /**
   * @param modelService Service used to get Model List information from the Server
   */
  constructor(private modelService: ModelService) {
  }

  /**
   * Resolve method.
   *
   * The list of Models obtained is stored in the route's data, and can be accessed using the
   * router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the models or an observable of null if they couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<PaginatedModels> {

    const params = {};

    if (route.queryParams['q']) {
      params['search'] = route.queryParams['q'];
    }

    if (route.queryParams['page'] && route.queryParams['page'] > 0) {
      params['page'] = route.queryParams['page'];
    }

    if (route.queryParams['per_page']) {
      params['per_page'] = route.queryParams['per_page'];
    }

    return this.modelService.getList(params).pipe(
      map((models) => {
        return models;
      }),
      catchError((err) => {
        return of(null);
      })
    );
  }
}
