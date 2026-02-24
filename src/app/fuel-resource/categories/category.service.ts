import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Category } from './category';
import { JsonClassFactoryService } from '../../factory/json-class-factory.service';
import { UiError } from '../../ui-error';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})

/**
 * The Category service is in charge of making category-related requests to the Fuel server.
 */
export class CategoryService {

  /**
   * Fuel server URL with version used to to Category-related requests.
   */
  public url: string = `${environment.API_HOST}/${environment.API_VERSION}/categories`;

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
    return this.http.get(this.url).pipe(
      map((response) => {
        return this.factory.fromJson(response, Category);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Add a new category.
   * Note: Only system admins can request this.
   *
   * @param category The new category.
   * @returns An observable of the new category.
   */
  public add(category: Category): Observable<any> {
    return this.http.post(this.url, category).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Modify a category.
   * Note: Only system admins can request this
   *
   * @param category The category to modify.
   * @param newCategory The modified category.
   * @returns An observable of the modified category.
   */
  public modify(category: Category, newCategory: Category): Observable<any> {
    const url = `${this.url}/${category.slug}`;
    return this.http.patch(url, newCategory).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a category.
   * Note: Only system admins can request this.
   *
   * @param category The category to delete.
   * @returns An observable of the deleted category.
   */
  public delete(category: Category): Observable<any> {
    const url = `${this.url}/${category.slug}`;
    return this.http.delete(url).pipe(
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
