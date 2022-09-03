import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Organization, PaginatedOrganizations } from '../organization';
import { Portal } from './portal';
import { Registration } from './registration';
import { PaginatedRegistration } from './paginated-registration';
import { LeaderBoardEntry } from './leaderboard/leaderboard-entry';
import { PaginatedLeaderBoardEntry } from './leaderboard/paginated-leaderboard-entry';
import { UiError } from '../ui-error';
import { environment } from '../../environments/environment';

import { parseLinkHeader } from '@web3-storage/parse-link-header';

@Injectable()

/**
 * The Portal service is in charge of making requests to the Backend server related to Portals.
 * TODO(german-mas): This service needs to be completed once portals are available in the Server.
 * See https://app.asana.com/0/851925973517080/909537141592497/f
 */
export class PortalService {

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;

  /**
   * Keep track of the next URL in the pagination.
   */
  public nextUrl: string;

  /**
   * Private field used as a constant to represent X-Total-Count header name.
   */
  private headerTotalCount: string = 'X-Total-Count';

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
   * Get the first page of all the portals from the Server.
   * TODO(german-mas): This returns fake data, intended to be used as a placeholder.
   * See https://app.asana.com/0/851925973517080/909537141592497/f
   */
  public getList(): Observable<Portal[]> {

    // TODO(german-mas): Hardcoded data.
    const portal = new Portal({
      name: 'SubT',
      owner: 'DARPA',
      description: `Welcome to the SubT Portal. Competitors in the virtual track of SubT can use
        this portal to register, submit solutions, and access information about the challenge.`,
    });

    return of([portal]);
  }

  /**
   * Get a single Portal from the Server.
   * TODO(german-mas): This returns fake data, intended to be used as a placeholder.
   * See https://app.asana.com/0/851925973517080/909537141592497/f
   *
   * @param owner The owner of the portal.
   * @param name The name of the portal.
   * @returns An instance of the portal.
   */
  public get(owner: string, name: string): Observable<Portal> {

    // TODO(german-mas): Hardcoded data.
    const portal = new Portal({
      name: 'SubT',
      owner: 'DARPA',
      description: `Welcome to the SubT Portal. Competitors in the virtual track of SubT can use
        this portal to register, submit solutions, and access information about the challenge.`,
    });

    return of(portal);
  }

  /**
   * Send a registration request to the Server.
   *
   * @param orgName The name of the Organization to register into the competition.
   * @returns An observable of the Registration sent.
   */
  public sendRegistrationRequest(orgName: string): Observable<Registration> {
    return this.http.post<Registration>(`${this.baseUrl}/subt/registrations`,
      {participant: orgName}).pipe(
        map((response) => {
          return this.factory.fromJson(response, Registration);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get a list of registrations of a given status.
   *
   * @param status Get requests that are 'pending', 'done' or 'rejected'.
   * @param page Optional. The page number to get the requests from the server.
   * @returns An observable of the paginated registration.
   */
  public getRegistrationRequests(status: 'pending' | 'done' | 'rejected',
                                 page?: number): Observable<PaginatedRegistration> {
    const url = `${this.baseUrl}/subt/registrations`;
    let httpParams = new HttpParams();
    httpParams = httpParams.set('status', status);
    httpParams = httpParams.set('per_page', '10');
    if (page) {
      httpParams = httpParams.set('page', page.toString());
    }
    return this.http.get<Registration[]>(url, {params: httpParams, observe: 'response'}).pipe(
      map((response) => {
        const res = new PaginatedRegistration();
        res.totalCount = +response.headers.get(this.headerTotalCount);
        res.registrations = this.factory.fromJson(response.body, Registration);
        res.nextPage = this.parseHeader(response);
        return res;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Modify a registration request. Requests are pending by default, and can be approved
   * or rejected.
   * @param orgName The organization that wants to participate in the competition.
   * @param approve A boolean to determine if the request is approved or rejected.
   * @param comment Optional. A comment to send regarding the registration.
   * @returns An observable of the modified registration.
   */
  public modifyRegistration(orgName: string,
                            approve: boolean,
                            comment?: string): Observable<Registration> {
    // Note: Approval is handled in integers.
    // 0 -> Pending.
    // 1 -> Approved.
    // 2 -> Rejected.
    let resolution;
    if (approve) {
      resolution = 1;
    } else {
      resolution = 2;
    }

    return this.http.patch<Registration>(`${this.baseUrl}/subt/registrations/subt/${orgName}`,
      {resolution, comment}).pipe(
        map((response) => {
          return this.factory.fromJson(response, Registration);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Remove a registered partcipant.
   * @param orgName The organization that was registered in the competition.
   * @param comment Optional. A comment to send regarding the registration.
   * @returns An observable of the deleted participant.
   */
  public removeParticipant(orgName: string,
                           comment?: string): Observable<Organization> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('comment', comment);

    return this.http.delete<Registration>(`${this.baseUrl}/subt/participants/subt/${orgName}`,
      { params: httpParams, observe: 'response' }).pipe(
        map((response) => {
          return this.factory.fromJson(response, Registration);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get the list of participants.
   * Participants join the competition once their registrations are approved.
   * The response depends on the permissions the requesting user has.
   *
   * @param page Optional. The page number to get the participants from the server.
   * @returns An observable of the Server response.
   */
  public getParticipants(page?: number): Observable<PaginatedOrganizations> {
    let url = `${this.baseUrl}/subt/participants?per_page=10`;
    if (page) {
      url += `&page=${page}`;
    }
    return this.http.get(url, {observe: 'response'}).pipe(
      map((response) => {
        this.parseHeader(response);
        if (response.body) {
          const paginatedOrg = new PaginatedOrganizations();
          paginatedOrg.totalCount = +response.headers.get(this.headerTotalCount);
          paginatedOrg.organizations = this.factory.fromJson(response.body, Organization);
          return paginatedOrg;
        }
        return undefined;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the score of all participants.
   *
   * @param page Optional. The page number to get from the server.
   * @returns An observable of the Server response.
   */
  public getScore(page?: number): Observable<PaginatedLeaderBoardEntry> {
    const url = `${this.baseUrl}/subt/leaderboard`;
    let httpParams = new HttpParams();
    httpParams = httpParams.set('per_page', '10');
    if (page) {
      httpParams = httpParams.set('page', page.toString());
    }

    return this.http.get(url, {params: httpParams, observe: 'response'}).pipe(
      map(
        (response) => {
          const paginatedEntries = new PaginatedLeaderBoardEntry();
          paginatedEntries.entries = this.factory.fromJson(
            response.body, LeaderBoardEntry);
          paginatedEntries.totalCount = +response.headers.get(this.headerTotalCount);
          return paginatedEntries;
        }),
      catchError(this.handleError)
    );
  }

  /**
   * Parses the Link Header of the response, in order to obtain the next URL
   * of the pagination.
   *
   * @param response The response that has a Link header to parse.
   * @returns The URL of the next page or null if there is none.
   */
  private parseHeader(response: HttpResponse<any>): string {
    const link = response.headers.get('link');
    if (link &&
        parseLinkHeader(link) &&
        parseLinkHeader(link).next) {
      const url = parseLinkHeader(link).next.url;
      this.nextUrl = `${environment.API_HOST}${url}`;
    } else {
      this.nextUrl = null;
    }
    return this.nextUrl;
  }

  /**
   * Error handling previous to subscription.
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
