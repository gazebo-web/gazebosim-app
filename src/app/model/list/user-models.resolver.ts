import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PaginatedModels } from '../paginated-models';
import { ModelService } from '../model.service';

@Injectable({
  providedIn: 'root',
})

/**
 * Resolver that fetches the models that belong to a certain user.
 *
 * This allows us to have the list of models before it's displayed in a Component.
 */
export class UserModelsResolver implements Resolve<PaginatedModels> {

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

    const modelOwner: string = route.paramMap.get('owner');

    return this.modelService.getOwnerList(modelOwner).pipe(
      map((models) => {
        return models;
      }),
      catchError((err) => {
        return of(null);
      })
    );
  }
}
