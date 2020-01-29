import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Model } from './model';
import { ModelService } from './model.service';

@Injectable()

/**
 * Resolver for the :owner/models/:modelname route.
 *
 * Fetches the model to display before the ModelComponent is created.
 */
export class ModelResolver implements Resolve<Model> {

  /**
   * @param modelService Service used to get Model information from the Server.
   */
  constructor(private modelService: ModelService) {
  }

  /**
   * Resolve method.
   *
   * The Model obtained is stored in the route's data, and can be accessed
   * using the router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the model or an observable of null if it couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<Model> {
    const modelOwner: string = route.paramMap.get('owner');
    const modelName: string = route.paramMap.get('modelname');

    return this.modelService.get(modelOwner, modelName).catch(
      (err) => {
        return Observable.of(null);
      });
  }
}
