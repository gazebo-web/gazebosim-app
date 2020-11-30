import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Simulation } from '../simulation';
import { SimulationService } from '../simulation.service';

@Injectable()

/**
 * Resolver for the admin/cloudsim/:groupId route.
 *
 * Fetches the simulation to display before the SimulationComponent is created.
 */
export class SimulationResolver implements Resolve<Simulation> {

  /**
   * @param simulationService Service used to get Simulation information from the Cloudsim Server.
   */
  constructor(private simulationService: SimulationService) {
  }

  /**
   * Resolve method.
   *
   * The Simulation obtained is stored in the route's data, and can be accessed
   * using the router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the simulation or an observable of null if it couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<Simulation> {
    const groupId: string = route.paramMap.get('groupId');

    return this.simulationService.getSimulation(groupId).pipe(
      catchError((err) => {
        return of(null);
      })
    );
  }
}
