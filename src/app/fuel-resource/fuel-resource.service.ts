import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { UiError } from '../ui-error';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

import { FuelResource } from './fuel-resource';
import { FuelPaginatedResource } from './fuel-paginated-resource';

import { parseLinkHeader } from '@web3-storage/parse-link-header';

/**
 * The Fuel Resource service is in charge of making resource-related requests to the Backend
 * server.
 *
 * This is an abstract service that provides common methods for each fuel-related resource.
 * Each resource (Model, World) should have it's own service (ModelService, WorldService) that
 * extends this one.
 */
export abstract class FuelResourceService {

  /**
   * Private field used as a constant to represent X-Total-Count header name.
   */
  private static readonly headerTotalCount: string = 'X-Total-Count';

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;

  /**
   * The type of resource that will be handled by the service, for the URL construction.
   * It is abstract, so it needs to be defined by each particular service that extends this one.
   */
  public abstract resourceType: string;

  /**
   * Class of the resource to be instantiated by the factory.
   * It is abstract, so it needs to be defined by each particular service that extends this one.
   */
  public abstract resourceClass;

  /**
   * Class of the paginated resource to be instantiated by the factory.
   * It is abstract, so it needs to be defined by each particular service that extends this one.
   */
  public abstract paginatedResourceClass;

  /**
   * Keep track of the next URL.
   */
  public nextUrl: string;

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
   * Get the first page of all the resources from the Backend.
   *
   * @param params An object containing possible params for the request. They are the following:
   *               - search: String. The search parameters to be sent as a "q" query parameter.
   *               - page: Number. The page of resources to get.
   *               - per_page: Number. The number of resources to get per page.
   * @returns An observable of the paginated resources.
   */
   public getList(params?: object): Observable<FuelPaginatedResource> {
    const url = this.getListUrl();
    let httpParams = new HttpParams();

    if (params) {
      if (params['search']) {
        httpParams = httpParams.append('q', params['search']);
      }
      if (params['page']) {
        httpParams = httpParams.append('page', params['page'].toString());
      }
      if (params['per_page']) {
        httpParams = httpParams.append('per_page', params['per_page'].toString());
      }
    }

    return this.http.get(url, {observe: 'response', params: httpParams}).pipe(
      map((response) => {
        const paginatedResource = new this.paginatedResourceClass();
        paginatedResource.totalCount = +response.headers.get(
          FuelResourceService.headerTotalCount);
        paginatedResource.resources = this.factory.fromJson(response.body, this.resourceClass);
        paginatedResource.nextPage = this.parseHeader(response);
        return paginatedResource;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the first page of all the resources that belong to a certain entity from the Backend.
   *
   * @param owner The owner of the resources.
   * @param params An object containing possible params for the request. They are the following:
   *               - search: String. The search parameters to be sent as a "q" query parameter.
   *               - page: Number. The page of resources to get.
   *               - per_page: Number. The number of resources to get per page.
   * @returns An observable of the paginated resources.
   */
  public getOwnerList(owner: string, params?: object): Observable<FuelPaginatedResource> {
    const url = this.getOwnerListUrl(owner);
    let httpParams = new HttpParams();

    if (params) {
      if (params['search']) {
        httpParams = httpParams.append('q', params['search']);
      }
      if (params['page']) {
        httpParams = httpParams.append('page', params['page'].toString());
      }
      if (params['per_page']) {
        httpParams = httpParams.append('per_page', params['per_page'].toString());
      }
    }

    return this.http.get(url, {observe: 'response', params: httpParams}).pipe(
      map((response) => {
        const paginatedResource = new this.paginatedResourceClass();
        paginatedResource.totalCount = +response.headers.get(
          FuelResourceService.headerTotalCount);
        paginatedResource.resources = this.factory.fromJson(response.body, this.resourceClass);
        paginatedResource.nextPage = this.parseHeader(response);
        return paginatedResource;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the first page of all the resources that a user liked.
   *
   * @param username The user to get their liked resources.
   * @returns An observable of the paginated resources.
   */
  public getUserLikedList(username: string): Observable<FuelPaginatedResource> {
    const url = this.getUserLikedListUrl(username);

    return this.http.get(url, {observe: 'response'}).pipe(
      map((response) => {
        const paginatedResource = new this.paginatedResourceClass();
        paginatedResource.totalCount = +response.headers.get(
          FuelResourceService.headerTotalCount);
        paginatedResource.resources = this.factory.fromJson(response.body, this.resourceClass);
        paginatedResource.nextPage = this.parseHeader(response);
        return paginatedResource;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the next page of resources from the Backend. Used to fetch the next resources
   * when using an infinite scroll.
   * TODO(german-e-mas): Deprecate as Infinite Scrolling is removed.
   *
   * @param paginatedResource The resource to load the next page of.
   * @param params An object containing possible params for the request. They are the following:
   *               - search: String. The search parameters to be sent as a "q" query parameter.
   *               - page: Number. The page of resources to get.
   *               - per_page: Number. The number of resources to get per page.
   * @returns An observable of the paginated resources.
   */
  public getNextPage(paginatedResource: FuelPaginatedResource, params?: object): Observable<FuelPaginatedResource> {
    let httpParams = new HttpParams();

    if (params) {
      if (params['search']) {
        httpParams = httpParams.append('q', params['search']);
      }
      if (params['page']) {
        httpParams = httpParams.append('page', params['page'].toString());
      }
      if (params['per_page']) {
        httpParams = httpParams.append('per_page', params['per_page'].toString());
      }
    }

    return this.http.get<FuelResource[]>(paginatedResource.nextPage, { observe: 'response', params: httpParams }).pipe(
      map((response) => {
        const res = new this.paginatedResourceClass();
        res.totalCount = +response.headers.get(
          FuelResourceService.headerTotalCount);
        res.resources = this.factory.fromJson(response.body, this.resourceClass);
        res.nextPage = this.parseHeader(response);
        return res;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single resource from the Backend.
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @returns An instance of the resource.
   */
  public get(owner: string, name: string): Observable<FuelResource> {
    const url = this.getResourceUrl(owner, name);
    return this.http.get<FuelResource>(url).pipe(
      map((response) => {
        return this.factory.fromJson(response, this.resourceClass);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Post a new resource into the backend.
   *
   * @param formData The form data to be uploaded.
   * @returns An observable of the HTTP response. It contains the uploaded resource in its body.
   */
  public upload(formData: FormData): Observable<HttpResponse<FuelResource> | any> {
    const url = this.getListUrl();
    return this.http.post(url, formData, { observe: 'response' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Edit a resource from the backend.
   *
   * @param owner The owner of the resource to edit.
   * @param name The name of the resource to edit.
   * @param formData The form data that contains the parameters to edit.
   * @returns An observable of the edited resource.
   */
  public edit(owner: string, name: string, formData: any): Observable<FuelResource> {
    const url = this.getResourceUrl(owner, name);
    return this.http.patch<FuelResource>(url, formData).pipe(
      map((response) => {
        return this.factory.fromJson(response, this.resourceClass);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Delete the resource from the backend.
   *
   * @param res The resource to delete.
   * @returns An observable of the deleted resource.
   */
  public delete(res: FuelResource): Observable<FuelResource | any> {
    const url = this.getResourceUrl(res.owner, res.name);
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Like the resource.
   *
   * @param res The resource to like.
   * @returns An observable of the number of likes the resource has.
   */
  public like(res: FuelResource): Observable<number | any> {
    const url = this.getLikeUrl(res.owner, res.name);
    return this.http.post(url, null).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Unlike the resource.
   *
   * @param res The resource to unlike.
   * @returns An observable of the number of likes the resource has.
   */
  public unlike(res: FuelResource): Observable<number | any> {
    const url = this.getLikeUrl(res.owner, res.name);
    return this.http.delete(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Copy a resource.
   *
   * @param resource The resource to copy.
   * @param newName The new name for the copied resource.
   * @param newName The new owner for the copied resource.
   * @returns An observable of the copied resource.
   */
  public copy(res: FuelResource, newName, newOwner): Observable<FuelResource> {
    const url = this.getCopyUrl(res.owner, res.name);

    const form = new FormData();
    form.append('name', newName);
    form.append('owner', newOwner);

    return this.http.post<FuelResource>(url, form).pipe(
      map((response) => {
        return this.factory.fromJson(response, this.resourceClass);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get the resource zip file as a blob.
   *
   * @param res The resource to download.
   * @param version (Optional) The version of the resource to download. If not specified, the latest
   * one is downloaded.
   * @returns An observable of the Blob to download.
   */
  public download(res: FuelResource, version?: string | number): Observable<Blob> {
    const url = `${this.getZipUrl(res.owner, res.name, version)}`;
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Report a resource
   *
   * @param res The resource to report
   * @param reason The reason why the resource was reported
   * @returns An observable of the server response.
   */
  public report(res: FuelResource, reason: string): Observable<any> {
    const form = new FormData();
    form.append('reason', reason);
    return this.http.post(this.getReportUrl(res.owner, res.name), form).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a file as a Blob. Useful to get private files, as it includes an Authorization Header.
   *
   * @param url The full URL of the file.
   * @returns An observable of the Blob.
   */
  public getFileAsBlob(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get the File Tree of the given resource.
   *
   * @param res The resource to get the file tree from.
   * @param version (Optional) The version of the file tree to get. If not specified, the tip
   * is returned.
   * @returns An observable that contains the file tree of the resource.
   */
  public getFileTree(res: FuelResource, version?: string | number): Observable<any> {
    const url = this.getFilesUrl(res.owner, res.name, version);

    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Helper method to compose a server route of a resource.
   * Used by other server routes that do not require the version of the resource.
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @returns The URL of the resource.
   */
  public getBaseUrl(owner: string, name: string): string {
    const encodedName = encodeURIComponent(name);
    return `${this.baseUrl}/${owner}/${this.resourceType}/${encodedName}`;
  }

  /**
   * Helper method to compose a server route of a resource with the provided version.
   * Used by other server routes that require the version of the resource, such as files or
   * download.
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @param version (Optional) The version of the resource. If empty, tip is used.
   * @returns The base URL of the server route to a resource with its version.
   */
  public getBaseVersionUrl(owner: string, name: string, version?: string | number): string {
    let modelVersion;
    if (version) {
      modelVersion = version;
    } else {
      modelVersion = 'tip';
    }
    return `${this.getBaseUrl(owner, name)}/${modelVersion}`;
  }

  /**
   * Server route of an individual file of a resource.
   * The route is apiUrl/apiVersion/owner/resourceType/name/version/files/[pathToFile]
   *
   * @param res The resource to get the file from.
   * @param file The file of the resource to get it's path.
   * @param version Optional. The version of the resource.
   * @returns The URL of the server route to an individual file.
   */
  public getIndividualFileUrl(res: FuelResource, file: File, version?: number | string): string {
    const filePath = file['path'];
    // The file path starts with the forward slash.
    return `${this.getFilesUrl(res.owner, res.name, version)}${filePath}`;
  }

  /**
   * Get the list of available permission names.
   *
   * @returns A list of strings, one for each permission.
   */
  public getPermissionList(): string[] {
    return ['Public', 'Private'];
  }

  /**
   * Server route of the public list of resources.
   * The route is apiUrl/apiVersion/resourceType
   *
   * @returns The URL of the server route of the list of resources.
   */
  private getListUrl(): string {
    return `${this.baseUrl}/${this.resourceType}`;
  }

  /**
   * Server route of the list of resources owned by an entity.
   * The route is apiUrl/apiVersion/owner/resourceType
   *
   * @param owner The owner of the resources.
   * @returns The URL of the server route of the list of resources owned by the entity.
   */
  private getOwnerListUrl(owner: string): string {
    return `${this.baseUrl}/${owner}/${this.resourceType}`;
  }

  /**
   * Server route of the list of resources liked by a user.
   * The route is apiUrl/apiVersion/username/likes/resourceType
   *
   * @param username The user who liked the resources.
   * @returns The URL of the server route of the list of resources liked by the user.
   */
  private getUserLikedListUrl(username: string): string {
    return `${this.baseUrl}/${username}/likes/${this.resourceType}`;
  }

  /**
   * Server route of a particular resource.
   * The route is apiUrl/apiVersion/owner/resourceType/name
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @returns The URL of the server route to a single resource.
   */
  private getResourceUrl(owner: string, name: string): string {
    const encodedName = encodeURIComponent(name);
    return `${this.baseUrl}/${owner}/${this.resourceType}/${encodedName}`;
  }

  /**
   * Server route to like or unlike a particular resource.
   * The route is apiUrl/apiVersion/owner/resourceType/name/likes
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @returns The URL of the server route to like or unlike a single resource.
   */
  private getLikeUrl(owner: string, name: string): string {
    const encodedName = encodeURIComponent(name);
    return `${this.baseUrl}/${owner}/${this.resourceType}/${encodedName}/likes`;
  }

  /**
   * Server route to report a resource
   * The route is apiUrl/apiVersion/reports/username/resourceType/modelName
   *
   * @param username The user who liked the resources.
   * @returns The URL of the server route of the list of resources liked by the user.
   */
  private getReportUrl(username: string, name: string): string {
    const encodedName = encodeURIComponent(name);
    return `${this.baseUrl}/${username}/${this.resourceType}/${encodedName}/report`;
  }

  /**
   * Server route to copy a particular resource.
   * The route is apiUrl/apiVersion/username/resourceType/name/clone
   *
   * @param owner The owner of the resource to copy.
   * @param name The name of the model to copy.
   * @returns The URL of the server route to copy a single resource.
   */
  private getCopyUrl(owner: string, name: string): string {
    const encodedName = encodeURIComponent(name);
    return `${this.baseUrl}/${owner}/${this.resourceType}/${encodedName}/clone`;
  }

  /**
   * Server route to a resource's zip file.
   * The route is apiUrl/apiVersion/owner/resourceType/name/version/name.zip
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @param version (Optional) The version of the resource. If empty, tip is used.
   * @returns The URL of the resource zip file.
   */
  private getZipUrl(owner: string, name: string, version?: string | number): string {
    const encodedName = encodeURIComponent(name);
    return `${this.getBaseVersionUrl(owner, name, version)}/${encodedName}.zip`;
  }

  /**
   * Server route to get the file tree of a particular resource.
   * The route is apiUrl/apiVersion/owner/resourceType/name/version/files
   *
   * @param owner The owner of the resource.
   * @param name The name of the resource.
   * @param version (Optional) The version of the resource. If empty, tip is used.
   * @returns The URL of the server route to get the file tree of a single resource.
   */
  private getFilesUrl(owner: string, name: string, version?: string | number): string {
    return `${this.getBaseVersionUrl(owner, name, version)}/files`;
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
