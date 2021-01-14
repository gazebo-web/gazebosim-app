import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { ErrMsg } from '../server/err-msg';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { UiError } from '../ui-error';
import { User } from './user';
import { PaginatedAccessToken } from '../settings/paginated-access-token';
import { AccessToken } from '../settings/access-token';
import { environment } from '../../environments/environment';

@Injectable()

/**
 * The User Service is in charge of making User related requests to the Fuel server.
 */
export class UserService {
  private static readonly headerTotalCount: string = 'X-Total-Count';

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;

  /**
   * @param authService Service to get authentication information.
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    private authService: AuthService,
    private factory: JsonClassFactoryService,
    private http: HttpClient) {
  }

  /**
   * Fetches the Fuel user associated with the given JWT token, in order to log in.
   *
   * @returns An Observable of the corresponding user.
   */
  public getLogin(): Observable<User> {
    const url = this.getLoginUrl();
    return this.http.get(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError((error) => {
        const uiError = new UiError(error);
        if (!(uiError.code === ErrMsg.ErrorAuthNoUser ||
          error.code === ErrMsg.ErrorResourceExists)) {
          console.error('An error occurred', error);
        }
        return throwError(uiError);
      })
    );
  }

  /**
   * Get a single user from the Server.
   *
   * @param name The name of the user.
   * @returns An observable of the user.
   */
  public getUser(name: string): Observable<User> {
    const url = this.getUserUrl(name);
    return this.http.get<User>(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create a User Account.
   *
   * @param body Json containing the user related information.
   * @returns An Observable of the created user.
   */
  public createUser(body: any): Observable<User> {
    const url = this.getUserListUrl();
    return this.http.post(url, body).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a specific user. Users can delete only themselves, verified by their JWT.
   *
   * @param username The username to delete.
   * @returns An observable of the deleted user.
   */
  public deleteUser(username: string): Observable<any> {
    const url = this.getUserUrl(username);
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get an User or Organization, along with it's type. Used by the router to disambiguate them.
   *
   * @param name The name of the user or organization.
   * @returns An observable of the response.
   */
  public getProfile(name: string): Observable<any> {
    const url = this.getProfileUrl(name);
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new access token for a user.
   * @param name The name of the user.
   * @returns An observable of the response.
   */
  public createAccessToken(username, tokenname: string): Observable<AccessToken> {
    const url = `${this.getUserUrl(username)}/access-tokens`;
    const body = {
      name: tokenname,
    };
    return this.http.post(url, body).pipe(
      map((response) => {
        return this.factory.fromJson(response, AccessToken);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete an access token for a user.
   * @param token The token to delete of the user.
   * @returns An observable of the response.
   */
  public revokeAccessToken(username: string, token: AccessToken): Observable<any> {
    const url = `${this.getUserUrl(username)}/access-tokens/revoke`;
    return this.http.post(url, token).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the active access tokens of a user.
   * @param name The name of the user.
   * @returns An observable of the response.
   */
  public getAccessTokens(name: string, page?: number): Observable<PaginatedAccessToken> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('per_page', '10');
    if (page) {
      httpParams = httpParams.set('page', page.toString());
    }
    const url = `${this.getUserUrl(name)}/access-tokens`;
    return this.http.get<PaginatedAccessToken>(url, {params: httpParams, observe: 'response'})
      .pipe(
        map((response) => {
          const paginatedAccessToken = new PaginatedAccessToken();
          paginatedAccessToken.totalCount = +response.headers.get(UserService.headerTotalCount);
          paginatedAccessToken.accessTokens = this.factory.fromJson(response.body, AccessToken);
          return paginatedAccessToken;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Server route to login.
   * Used to get the Fuel user associated with the JWT in the Authorization header.
   * The route is apiUrl/apiVersion/login
   *
   * @returns The URL of the server route to login.
   */
  private getLoginUrl(): string {
    return `${this.baseUrl}/login`;
  }

  /**
   * Server route of the user list.
   * Used to get a list of users or create one.
   * The route is apiUrl/apiVersion/users
   *
   * @returns The URL of the server route of the users.
   */
  private getUserListUrl(): string {
    return `${this.baseUrl}/users`;
  }

  /**
   * Server route of a particular user.
   * Used to get details of a particular user, update or delete it.
   * The route is apiUrl/apiVersion/users/name
   *
   * @param name The name of the user.
   * @returns The URL of the server route of a particular user.
   */
  private getUserUrl(name: string): string {
    return `${this.getUserListUrl()}/${name}`;
  }

  /**
   * Server route used to disambiguate a user from an organization.
   * The route is apiUrl/apiVersion/profile/name
   *
   * @param name The name of the user or organization.
   * @returns The URL of the server route of a particular user or organization.
   */
  private getProfileUrl(name: string): string {
    return `${this.baseUrl}/profile/${name}`;
  }

  /**
   * Error handling previous to subscription.
   *
   * To avoid code duplication in the components that use this service, errors are thrown using an
   * instance of the UiError class.
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
