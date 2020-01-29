import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()

/**
 * An interceptor to append the Authentication Header to requests made by the HttpClient of
 * Angular.
 *
 * Note: Requests done without the HttpClient module (such as HTML img tags or CSS url properties)
 * won't have the authorization header.
 */
export class AuthInterceptor implements HttpInterceptor {

  /**
   * Main method of the HttpInterceptor, that allows us to provide a middleman to HttpClient and
   * modify the request by appending the Authorization Header.
   *
   * @param req The original request made.
   * @param next Passes the request to the next handler.
   */
  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = localStorage.getItem('token');

    // Skip if there is a S3-related query parameter in the URL.
    const skip = req.url.indexOf('X-Amz-Signature') > -1;

    if (token && !skip) {
      // The request is immutable, so we need to clone it.
      const clonedRequest = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next.handle(clonedRequest);
    } else {
      return next.handle(req);
    }
  }
}
