import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Category } from './category';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { UiError } from '../../ui-error';

@Injectable()

/**
 * The Category service is in charge of making category-related requests to the Fuel server.
 */
export class CategoryService {

  /**
   * Fuel server URL with version used to to Category-related requests.
   */
  public url: string = `${API_HOST}/${API_VERSION}/categories`;

  /**
   * @param factory Factory to transform Json into an object instance.
   * @param http Angular's HttpClient in order to perform HTTP requests.
   */
  constructor(
    public factory: JsonClassFactoryService,
    public http: HttpClient) {
  }

  /**
   * Get all the available categories from the Fuel server.
   *
   * @returns An observable of the categories.
   */
  public getAll(): Observable<Category[]> {
    return this.http.get(this.url)
      .map((response) => {
        return this.factory.fromJson(response, Category);
      })
      .catch(this.handleError);
  }

  /**
   * Add a new category.
   * Note: Only system admins can request this.
   *
   * @param category The new category.
   * @returns An observable of the new category.
   */
  public add(category: Category): Observable<Category> {
    return this.http.post(this.url, category)
      .catch(this.handleError);
  }

  /**
   * Modify a category.
   * Note: Only system admins can request this
   *
   * @param category The category to modify.
   * @param newCategory The modified category.
   * @returns An observable of the modified category.
   */
  public modify(category: Category, newCategory: Category): Observable<Category> {
    const url = `${this.url}/${category.slug}`;
    return this.http.patch(url, newCategory)
      .catch(this.handleError);
  }

  /**
   * Delete a category.
   * Note: Only system admins can request this.
   *
   * @param category The category to delete.
   * @returns An observable of the deleted category.
   */
  public delete(category: Category): Observable<Category> {
    const url = `${this.url}/${category.slug}`;
    return this.http.delete(url)
      .catch(this.handleError);
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
