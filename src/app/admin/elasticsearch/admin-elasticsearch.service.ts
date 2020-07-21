import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

import { HttpClient, HttpResponse, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { UiError } from '../../ui-error';
import { AuthService } from '../../auth/auth.service';

import { ElasticsearchConfig } from './elasticsearch-config';

import 'rxjs/add/operator/catch';

import * as linkParser from 'parse-link-header';

@Injectable()

/**
 * The AdminElasticsearchService is the interface to the elastic search admin
 * interface on the fuelserver. You can get, modify, and add to the list of
 * elastic search server configurations.
 */
export class AdminElasticsearchService {

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${API_HOST}/${API_VERSION}`;

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
   * Get the list of elasticsearch configurations.
   */
  public getList(): Observable<ElasticsearchConfig[]> {
    const url = this.baseUrl + '/admin/search';
    return this.http.get(url, {observe: 'response'})
      .map((response) => {
        return this.factory.fromJson(response.body, ElasticsearchConfig);
      })
      .catch(this.handleError);
  }

  /**
   * Reconnect the list of elasticsearch configurations.
   */
   public reconnect(): Observable<any> {
    const url = this.baseUrl + '/admin/search/reconnect';
    return this.http.get(url, {observe: 'response'})
      .map((response) => {
        return response.body;
      })
      .catch(this.handleError);
  }

  /**
   * Rebuild the elasticsearch indices.
   */
   public rebuild(): Observable<any> {
    const url = this.baseUrl + '/admin/search/rebuild';
    return this.http.get(url, {observe: 'response'})
      .map((response) => {
        return response.body;
      })
      .catch(this.handleError);
  }

  /**
   * Update the elasticsearch indices.
   */
   public update(): Observable<any> {
    const url = this.baseUrl + '/admin/search/update';
    return this.http.get(url, {observe: 'response'})
      .map((response) => {
        return response.body;
      })
      .catch(this.handleError);
  }

  /**
   * Delete the elasticsearch config.
   */
   public delete(configId: number): Observable<any> {
     const url = this.baseUrl + `/admin/search/${configId}`;
     return this.http.delete(url).catch(this.handleError);
  }

  /**
   * Create an elasticsearch config.
   */
   public create(config: any): Observable<any> {
     const url = this.baseUrl + `/admin/search`;
     return this.http.post(url, config).catch(this.handleError);
  }

  /**
   * Modify an elasticsearch config.
   */
   public modify(configId: number, config: any): Observable<any> {
     const url = this.baseUrl + `/admin/search/${configId}`;
     return this.http.patch(url, config).catch(this.handleError);
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
  private handleError(response: HttpErrorResponse): ErrorObservable {
    console.error('An error occurred', response);
    return Observable.throw(new UiError(response));
  }
}
