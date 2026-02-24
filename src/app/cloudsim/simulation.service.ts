import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { UiError } from '../ui-error';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Machine } from './machine';
import { PaginatedMachine } from './paginated-machine';
import { Simulation } from './simulation';
import { PaginatedSimulation } from './paginated-simulation';
import { SimulationRule, PaginatedSimulationRules } from '../admin/cloudsim/rules';
import { QueueElement } from '../admin/cloudsim/launch-queue/queue-element';
import { QueueList } from '../admin/cloudsim/launch-queue/queue-list';
import { environment } from '../../environments/environment';
import { RobotType } from './robot-type';

@Injectable({
  providedIn: 'root',
})

/**
 * The Simulation service is in charge of making requests to the Cloudsim server.
 */
export class SimulationService {

  /**
   * Private field used as a constant to represent X-Total-Count header name.
   */
  private static readonly headerTotalCount: string = 'X-Total-Count';

  /**
   * The Simulation Server's base URL, including version.
   */
  public baseUrl: string = `${environment.CLOUDSIM_HOST}/${environment.CLOUDSIM_VERSION}`;

  /**
   * @param authService Service to get authentication information.
   * @param factory Factory to transform Json into an object instance.
   * @param http Performs HTTP requests.
   */
  constructor(
    protected authService: AuthService,
    protected factory: JsonClassFactoryService,
    protected http: HttpClient) {
  }

  /**
   * Get the list of all Simulations.
   *
   * @param params An object containing possible params for the request. They are the following:
   *               - status: String. The request will return only instances with this status.
   *               - errorStatus: String. The request will return only instances with this error
   *                              status.
   *               - owner: String. The owner of the simulations to get.
   *               - page: Number. The page of simulations to get.
   */
  public getSimulations(params?: object): Observable<PaginatedSimulation> {
    const url: string = `${this.baseUrl}/simulations`;
    let httpParams = new HttpParams();
    if (params) {
      if (params['status']) {
        httpParams = httpParams.set('status', params['status']);
      }
      if (params['errorStatus']) {
        httpParams = httpParams.set('errorStatus', params['errorStatus']);
      }
      if (params['owner']) {
        httpParams = httpParams.set('owner', params['owner']);
      }
      if (params['page']) {
        httpParams = httpParams.set('page', params['page'].toString());
      }
      if (params['children']) {
        httpParams = httpParams.set('children', params['children']);
      }
      if (params['circuit']) {
        httpParams = httpParams.set('circuit', params['circuit']);
      }
      if (params['pageSize']) {
        httpParams = httpParams.set('per_page', params['pageSize']);
      }
    }
    if (!httpParams.has('per_page')) {
      httpParams = httpParams.set('per_page', '10');
    }
    return this.http.get<PaginatedSimulation>(url, {params: httpParams, observe: 'response'})
      .pipe(
        map((response) => {
          const paginatedSim = new PaginatedSimulation();
          paginatedSim.totalCount = +response.headers.get(SimulationService.headerTotalCount);
          paginatedSim.simulations = this.factory.fromJson(response.body, Simulation);
          return paginatedSim;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a specific simulation
   * @param groupId Contains the group id of the required simulation.
   */
  public getSimulation(groupId: string): Observable<Simulation> {
    const url: string = `${this.baseUrl}/simulations/${groupId}`;
    return this.http.get<Simulation>(url).pipe(
      map((response) => this.factory.fromJson(response, Simulation)),
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific simulation's websocket information.
   * @param groupId Contains the group id of the required simulation.
   */
  public getSimulationWebsocket(groupId: string): Observable<any> {
    const url: string = `${this.baseUrl}/simulations/${groupId}/websocket`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Launch a simulation.
   *
   * @param formData Contains the information of the simulation to launch.
   * @returns An observable of the HTTP response.
   */
  public launch(formData: FormData): Observable<Simulation> {
    const url: string = `${this.baseUrl}/simulations`;
    return this.http.post<Simulation>(url, formData).pipe(
      map((response) => this.factory.fromJson(response, Simulation)),
      catchError(this.handleError)
    );
  }

  /**
   * Stops a simulation. The simulation to stop comes in a query parameter.
   *
   * @param groupId The id of the simulation to stop.
   * @returns An observable of the HTTP response.
   */
  public stop(groupId: string): Observable<any> {
    const url: string = `${this.baseUrl}/simulations/${groupId}`;
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Restart a simulation.
   *
   * @param groupId The id of the simulation to restart.
   * @returns An observable of the HTTP response.
   */
  public restart(groupId: string): Observable<Simulation> {
    const url: string = `${this.baseUrl}/simulations/${groupId}/restart`;
    return this.http.post(url, '').pipe(
      map((response) => this.factory.fromJson(response, Simulation)),
      catchError(this.handleError)
    );
  }

  /**
   * Download the simulation's logfiles.
   *
   * @param groupId The id of the simulation.
   * @returns An observable of the Server response.
   */
  public download(groupId: string): Observable<Blob> {
    const url = `${this.baseUrl}/simulations/${groupId}/logs/file`;

    // Note: MergeMap allows chaining requests.
    return this.http.get(url, {params: new HttpParams().set('link', 'true')}).pipe(
      mergeMap((responseUrl) => {
        // Note: The request to the S3 signed URL will fail if it has an Authorization header.
        // In the HTTP interceptor, the 'X-Amz-Signature' query parameter is detected in order to
        // skip adding this header.
        return this.http.get(responseUrl as string, {responseType: 'blob'});
      })
    );
  }

  /**
   * Get the list of all Machines.
   *
   * @param params An object containing possible params for the request. They are the following:
   *               - status: String. The request will return only instances with this status.
   *                         An empty string will not filter the results by status.
   *               - page: Number. The page of machines to get.
   */
  public getMachines(params?: any): Observable<PaginatedMachine> {
    const url: string = `${this.baseUrl}/machines`;
    let httpParams = new HttpParams();
    if (params) {
      if (params['status']) {
        httpParams = httpParams.set('status', params['status']);
      } else {
        httpParams = httpParams.set('status', '');
      }
      if (params['groupId']) {
        httpParams = httpParams.set('groupId', params['groupId']);
      }

      if (params['page']) {
        httpParams = httpParams.set('page', params['page'].toString());
      }
    }
    httpParams = httpParams.set('per_page', '10');
    return this.http.get<PaginatedMachine>(url, {params: httpParams, observe: 'response'})
      .pipe(
        map((response) => {
          const paginatedMachine = new PaginatedMachine();
          paginatedMachine.totalCount = +response.headers.get(SimulationService.headerTotalCount);
          paginatedMachine.machines = this.factory.fromJson(response.body, Machine);
          return paginatedMachine;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a paginated list of Simulation Rules.
   *
   * @param params An object containing possible params for the request. They are the following:
   *               - page: Number. The page of simulation rules to get.
   * @returns An instance of the paginated simulation rules.
   */
  public getRules(params?: any): Observable<PaginatedSimulationRules> {
    const url: string = `${this.baseUrl}/rules`;
    let httpParams = new HttpParams();
    if (params) {
      if (params['page']) {
        httpParams = httpParams.set('page', params['page'].toString());
      }
    }
    httpParams = httpParams.set('per_page', '10');
    return this.http.get<PaginatedSimulationRules>(url, {params: httpParams, observe: 'response'})
      .pipe(
        map((response) => {
          const paginatedRules = new PaginatedSimulationRules();
          paginatedRules.totalCount = +response.headers.get(SimulationService.headerTotalCount);
          paginatedRules.rules = this.factory.fromJson(response.body, SimulationRule);
          return paginatedRules;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Create a rule if it doesn't exists, or modify an existing one.
   *
   * @param rule The simulation rule to create or edit.
   * @returns The created or edited simulation rule.
   */
  public editOrCreateRule(rule: SimulationRule): Observable<SimulationRule> {

    let url: string = `${this.baseUrl}/rules`;
    url += `/${rule.circuit}/${rule.owner}/${rule.type}/${rule.value}`;

    return this.http.put<SimulationRule>(url, {}).pipe(
      map((response) => this.factory.fromJson(response, SimulationRule)),
      catchError(this.handleError)
    );
  }

  /**
   * Remove an existing Simulation Rule.
   *
   * @param rule The Simulation Rule to remove.
   * @returns The removed simulation rule.
   */
  public deleteRule(rule: SimulationRule): Observable<SimulationRule> {

    const url: string = `${this.baseUrl}/rules/${rule.circuit}/${rule.owner}/${rule.type}`;

    return this.http.delete<SimulationRule>(url).pipe(
      map((response) => this.factory.fromJson(response, SimulationRule)),
      catchError(this.handleError)
    );
  }

  /**
   * Get the paginated list of elements from the launch queue
   * @param page The page to get the elements from.
   * @param perPage The number of elements per page.
   */
  public queueGet(page?: number, perPage?: number): Observable<QueueList> {
    const url: string = `${this.baseUrl}/queue`;

    let httpParams = new HttpParams();

    if (page) {
      httpParams = httpParams.append('page', page.toString());
    }

    if (perPage) {
      httpParams = httpParams.append('per_page', perPage.toString());
    }

    return this.http.get<string[]>(url, {params: httpParams, observe: 'response'}).pipe(
      map((response) => {
        const list: QueueList = new QueueList(response.body);
        list.totalCount = +response.headers.get(SimulationService.headerTotalCount);
        return list;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Counts the number of elements in the queue
   */
  public queueCount(): Observable<number> {
    const url: string = `${this.baseUrl}/queue/count`;
    return this.http.get<number>(url).pipe(
      map((length) => length),
      catchError(this.handleError)
    );
  }

  /**
   * Swap places between Group ID A and Group ID B in the queue
   * @param groupIdA The first groupId to swap
   * @param groupIdB The second groupId to swap
   */
  public queueSwap(groupIdA: string, groupIdB: string): Observable<boolean> {
    const url: string = `${this.baseUrl}/queue/${groupIdA}/swap/${groupIdB}`;

    return this.http.patch<string>(url, null).pipe(
      map((item) => !!item),
      catchError(this.handleError)
    );
  }

  /**
   * Moves an element to the front of the launch queue
   * @param groupId The groupId of the element to move to the front
   */
  public queueMoveToFront(groupId: string): Observable<QueueElement> {
    const url: string = `${this.baseUrl}/queue/${groupId}/move/front`;

    return this.http.patch<string>(url, null).pipe(
      map((item) => ({
        groupId: item,
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Moves an element to the back of the launch queue
   * @param groupId The groupId of the element to move to the back
   */
  public queueMoveToBack(groupId: string): Observable<QueueElement> {
    const url: string = `${this.baseUrl}/queue/${groupId}/move/back`;

    return this.http.patch<string>(url, null).pipe(
      map((item) => ({
        groupId: item,
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Removes an element from the launch queue
   * @param groupId The groupId of the element to remove
   */
  public queueRemove(groupId: string): Observable<QueueElement> {
    const url: string = `${this.baseUrl}/queue/${groupId}`;

    return this.http.delete<string>(url).pipe(
      map((item) => ({
        groupId: item,
      })),
      catchError(this.handleError)
    );
  }

  /**
   * Return the robot types available from the Cloudsim server.
   *
   * @returns An observable of the HTTP response.
   */
  public getRobotTypes(): Observable<RobotType[]> {
    const url: string = `${this.baseUrl}/competition/robots`;
    return this.http.get<RobotType[]>(url).pipe(
      map((robotTypes) => {
        try {
          return Object.keys(robotTypes).map(type => robotTypes[type]);
        } catch (e) {
          return [];
        }
      }),
      catchError(error => {
        throw new UiError(error);
      })
    );
  }

  /**
   * Get the log from a simulation. A robot name can be passed to obtain its logs.
   *
   * @param simulation The Simulation to get logs of.
   * @param robotName Optional. The name of a robot of the simulation to get its logs.
   * @returns An observable of the Server response.
   */
  public getLogs(simulation: Simulation, robotName?: string): Observable<Blob> {
    const url: string = `${this.baseUrl}/simulations/${simulation.groupId}/logs/file`;
    let httpParams = new HttpParams();

    httpParams = httpParams.append('link', 'true');
    if (robotName) {
      httpParams = httpParams.append('robot', robotName);
    }

    return this.http.get(url, {params: httpParams}).pipe(
      mergeMap(awsUrl => this.http.get(awsUrl as string, {responseType: 'blob'})),
      catchError(this.handleError)
    );
  }

  /**
   * Error handling.
   *
   * @param response The HttpErrorResponse that contains the error.
   * @returns An error observable with a UiError, which contains error code to handle and
   * message to display.
   */
  private handleError(response: HttpErrorResponse): Observable<never> {
    console.error('An error occurred', response);
    return throwError(new UiError(response));
  }
}
