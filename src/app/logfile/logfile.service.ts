import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';

import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { UiError } from '../ui-error';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
import { Logfile } from './logfile';
import { PaginatedLogfile } from './paginated-logfile';

import * as linkParser from 'parse-link-header';

@Injectable()

/**
 * The Logfile Service is in charge of making logfile-related requests to the Server.
 */
export class LogfileService {

  /**
   * Private field used as a constant to represent X-Total-Count header name.
   */
  private static readonly headerTotalCount: string = 'X-Total-Count';

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;

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
   * Get a list of logfiles.
   *
   * @param status Get logfiles that are 'pending', 'done' or 'rejected'.
   * @param page Optional. The page number to get the logfiles from the server.
   * @returns An observable of the paginated logfiles.
   */
  public getList(status: 'done' | 'pending' | 'rejected',
                 page?: number): Observable<PaginatedLogfile> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('status', status);
    httpParams = httpParams.set('per_page', '10');
    if (page) {
      httpParams = httpParams.set('page', page.toString());
    }
    const url = `${this.baseUrl}/subt/logfiles`;
    return this.http.get(url, {params: httpParams, observe: 'response'}).pipe(
      map((response) => {
        const paginatedLogfile = new PaginatedLogfile();
        paginatedLogfile.totalCount = +response.headers.get(
          LogfileService.headerTotalCount);
        paginatedLogfile.logfiles = this.factory.fromJson(response.body, Logfile);
        paginatedLogfile.nextPage = this.parseLinkHeader(response);
        return paginatedLogfile;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single logfile.
   *
   * @param id The id of the logfile to retrieve from the Server.
   * @returns An observable of the Server response.
   */
  public getLogfile(id: number): Observable<Logfile> {
    const url = `${this.baseUrl}/subt/logfiles/${id}`;

    return this.http.get<Logfile>(url).pipe(
      map((logfile) => {
        return new Logfile(logfile);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Upload a new logfile.
   *
   * @param form The FormData containing the information of the logfile to post.
   * @returns An observable of the Server response.
   */
  public upload(form: any): Observable<Logfile> {
    const url = `${this.baseUrl}/subt/logfiles`;

    return this.http.post<Logfile>(url, form).pipe(
      map((logfile) => {
        return new Logfile(logfile);
      }),
      catchError(this.handleUploadError)
    );
  }

  /**
   * Modify an existing logfile.
   * Used by admins to approve and score logfiles.
   *
   * @param id The id of the logfile to modify.
   * @param data The data to modify. It can be the status or the score.
   * @returns An observable of the Server response.
   */
  public modify(id: number, data: any): Observable<Logfile> {
    const url = `${this.baseUrl}/subt/logfiles/${id}`;

    return this.http.patch<Logfile>(url, data).pipe(
      map((logfile) => {
        return new Logfile(logfile);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Remove a logfile.
   * Note: Only the system admin has permission to do so.
   *
   * @param id The id of the logfile to remove.
   * @returns An observable of the Server response.
   */
  public remove(id: number): Observable<Logfile> {
    const url = `${this.baseUrl}/subt/logfiles/${id}`;

    return this.http.delete<Logfile>(url).pipe(
      map((logfile) => {
        return new Logfile(logfile);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Download a logfile.
   *
   * @param id The id of the logfile to download.
   * @returns An observable of the Server response.
   */
  public download(id: number): Observable<Blob> {
    const url = `${this.baseUrl}/subt/logfiles/${id}/file`;

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
   * Get the next page of logfiles from the Server. Used to use an infinite scroll.
   *
   * @param paginatedLogfile The paginated logfile to load the next page of.
   * @returns An observable of a paginated logfile.
   */
  public getNextPage(paginatedLogfile: PaginatedLogfile): Observable<PaginatedLogfile> {
    return this.http.get<PaginatedLogfile>(paginatedLogfile.nextPage, {observe: 'response'}).pipe(
      map((response) => {
        const res = new PaginatedLogfile();
        res.totalCount = +response.headers.get(
          LogfileService.headerTotalCount);
        res.logfiles = this.factory.fromJson(response.body, Logfile);
        res.nextPage = this.parseLinkHeader(response);
        return res;
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
  private parseLinkHeader(response: HttpResponse<any>): string {
    const link = response.headers.get('link');
    let nextUrl = null;
    if (link &&
      linkParser(link) &&
      linkParser(link).next) {
      const url = linkParser(link).next.url;
      nextUrl = `${environment.API_HOST}${url}`;
    }
    return nextUrl;
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

  /**
   * Handle an upload error.
   * While trying to upload a file larger than the server's size limit, the server responds with an
   * "Unknown error" status message. This prompts the user
   *
   * @param response The HttpErrorResponse that contains the error.
   * @returns An error observable with a UiError, which contains error code to handle and
   * message to display.
   */
  private handleUploadError(response: HttpErrorResponse): Observable<never> {
    console.error('An error occurred', response);
    const error = {...response,
      statusText: 'An error ocurred. Make sure your logfile is smaller than 800 MB.'};
    return throwError(new UiError(error));
  }
}
