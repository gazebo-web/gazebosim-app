import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UiError } from '../../ui-error';

@Injectable({
  providedIn: 'root',
})

/**
 * The Service used to communicate with the Billing endpoint, in order to do
 * credit-related operations.
 */
export class CreditsService {

  /**
   * The credits endpoint.
   */
  public creditsEndpoint: string = `${environment.CLOUDSIM_HOST}/${environment.CLOUDSIM_VERSION}`;

  /**
   * The redirect URL after Checkout.
   */
  public checkoutRedirectUrl: string = environment.CREDITS_REDIRECT;

  /**
   * @param http Performs HTTP requests.
   */
  constructor(
    public http: HttpClient,
  ) { }

  /**
   * Get the balance of credits.
   */
  public getBalance(): Observable<any> {
    const url = `${this.creditsEndpoint}/billing/credits`;
    return this.http.get(url).pipe(
      map((response) => {
        return response['credits'];
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 500 && error.error.errcode === 150000) {
          return of(0);
        } else {
          return this.handleError(error);
        }
      }),
    );
  }

  /**
   * Create a session for Stripe Checkout.
   */
  public createSession(): Observable<any> {
    const checkoutData = {
      success_url: this.checkoutRedirectUrl,
      cancel_url: this.checkoutRedirectUrl,
    };

    const url = `${this.creditsEndpoint}/billing/session`;
    return this.http.post(url, checkoutData);
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
