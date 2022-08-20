import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Organization } from './organization';
import { PaginatedOrganizations } from './paginated-organization';
import { UiError } from '../ui-error';
import { User } from '../user/user';
import { environment } from '../../environments/environment';

import { parseLinkHeader } from '@web3-storage/parse-link-header'

@Injectable()

/**
 * The Organization Service is in charge of making Organization related requests to the
 * Backend server.
 */
export class OrganizationService {

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
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    private authService: AuthService,
    private factory: JsonClassFactoryService,
    private http: HttpClient) {
  }

  /**
   * Get the list of Organizations
   *
   * @returns An observable of the paginated organizations.
   */
  public getPublicOrganizations(): Observable<PaginatedOrganizations> {
    const url = this.getOrganizationListUrl();
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
   * Get a single organization from the Backend.
   *
   * @param name The name of the organization.
   * @returns An instance of the organization.
   */
  public getOrganization(name: string): Observable<Organization> {
    const url = this.getOrganizationUrl(name);
    return this.http.get<Organization>(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, Organization);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Create an organization.
   * Call the POST /organizations route to upload a new organization.
   *
   * @param data The json data to be uploaded.
   * @returns An instance of the created organization.
   */
  public createOrganization(data: object): Observable<Organization> {
    const url = this.getOrganizationListUrl();
    return this.http.post(url, data).pipe(
      map((response) => {
        return this.factory.fromJson(response, Organization);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Edit an organization.
   * Calls the PATCH /organizations/name route.
   *
   * @param organization The organization to edit.
   * @param form The form data that contains the parameters to edit.
   * @returns An observable of the edited organization.
   */
  public editOrganization(organization: Organization, form: any): Observable<Organization> {
    const url = this.getOrganizationUrl(organization.name);
    return this.http.patch<Organization>(url, form).pipe(
      map((response) => {
        return this.factory.fromJson(response, Organization);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remove an organization.
   * Calls the DELETE /organizations/name route.
   *
   * @param organization The organization to delete.
   * @returns An observable of the deleted organization.
   */
  public deleteOrganization(organization: Organization): Observable<any> {
    const url = this.getOrganizationUrl(organization.name);
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get an organization's user list.
   * Calls the GET /organizations/name/users route.
   *
   * @param organization The organization to fetch the users.
   * @returns An observable of the list of users.
   */
  public getOrganizationUsers(organization: Organization): Observable<any[]> {
    const url = this.getOrganizationUserListUrl(organization.name);
    return this.http.get(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Add user to an organization.
   * Calls the POST /organizations/orgName/users route.
   *
   * @param org The organization to target.
   * @param user The username to add.
   * @param orgRole The role the user will have.
   * @returns An observable of null.
   */
  public addUserToOrganization(org: Organization, user: string, orgRole: string): Observable<any> {
    const url = this.getOrganizationUserListUrl(org.name);
    const body = {
      username: user,
      role: orgRole,
    };
    return this.http.post(url, body).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remove user from an organization.
   * Calls the DELETE /organizations/orgName/users/userName route.
   *
   * @param organization The organization to target.
   * @param user The user to delete.
   * @returns An observable of null.
   */
  public removeUserFromOrganization(organization: Organization, user: string): Observable<any> {
    const url = this.getOrganizationUserUrl(organization.name, user);
    return this.http.delete(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, User);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Check if the current page has a next page associated.
   *
   * @returns A boolean whether the current page has a next page or not.
   */
  public hasNextUrl(): boolean {
    return this.nextUrl != null;
  }

  /**
   * Server route of the organizations.
   * Used to get a list of organizations or create one.
   * The route is apiUrl/apiVersion/organizations
   *
   * @returns The URL of the server route of the organizations.
   */
  private getOrganizationListUrl(): string {
    return `${this.baseUrl}/organizations`;
  }

  /**
   * Server route of a particular organization.
   * Used to get details of a particular organization, update or delete it.
   * The route is apiUrl/apiVersion/organizations/name
   *
   * @param name The name of the organization.
   * @returns The URL of the server route of a particular organization.
   */
  private getOrganizationUrl(name: string): string {
    return `${this.getOrganizationListUrl()}/${name}`;
  }

  /**
   * Server route of to the user list of a particular organization.
   * Used to get the users of a particular organization or add more.
   * The route is apiUrl/apiVersion/organizations/name/users
   *
   * @param name The name of the organization.
   * @returns The URL of the server route of a particular organization's user list.
   */
   private getOrganizationUserListUrl(name: string): string {
    return `${this.getOrganizationListUrl()}/${name}/users`;
  }

  /**
   * Server route of a particular user within the organization.
   * Used to update or delete such user.
   * The route is apiUrl/apiVersion/organizations/orgName/users/userName
   *
   * @param orgName The name of the organization.
   * @param usernameName The name of the user that belongs to the organization.
   * @returns The URL of the server route of a particular user within the organization.
   */
  private getOrganizationUserUrl(orgName: string, userName: string): string {
    return `${this.getOrganizationUserListUrl(orgName)}/${userName}`;
  }

  /**
   * Parses the Link Header of the response, in order to obtain the next URL
   * of the pagination.
   *
   * @param response The response that has a Link header to parse.
   */
  private parseHeader(response: HttpResponse<any>): void {
    const link = response.headers.get('link');
    if (link &&
        parseLinkHeader(link) &&
        parseLinkHeader(link).next) {
      const url = parseLinkHeader(link).next.url;
      this.nextUrl = `${environment.API_HOST}${url}`;
    } else {
      this.nextUrl = null;
    }
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
