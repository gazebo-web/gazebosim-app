import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UiError } from '../ui-error';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

import * as linkParser from 'parse-link-header';

@Injectable()

/**
 * The Application Service is in charge of making Application related requests to the Fuel server.
 * versions). Perhaps it should be useful to split the current FuelResource class to distinguish
 * between resources with and without files.
 */
export class ApplicationService {

  /**
   * Private field used as a constant to represent X-Total-Count header name.
   */
  private static readonly headerTotalCount: string = 'X-Total-Count';

  /**
   * Base server URL, including version.
   */
   //public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;
   //public baseUrl: string = 'https://staging-cloudsim-nps.ignitionrobotics.org/1.0';
   public baseUrl: string = 'http://localhost:8001/1.0';

  /**
   * @param http Performs HTTP requests.
   */
  constructor(
    protected authService: AuthService,
    protected http: HttpClient) {
  }

  public start(formData: FormData): any {
    const url = `${this.baseUrl}/start`;
    return this.http.post(url, formData, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  public stop(groupid: string): any {
  const url = `${this.baseUrl}/stop/${groupid}`;
    return this.http.post(url, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  public getSimulations(): any {
    const url = `${this.baseUrl}/simulations`;
    return this.http.get(url, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Error handling previous to subscription.
   *
   * To avoid code duplication in the components that use extensions of this service,
   * errors are thrown using an instance of the UiError class.
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
