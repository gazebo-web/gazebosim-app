import { HttpErrorResponse } from '@angular/common/http';

/**
 * A class that allows a better error handling between Services and Components.
 *
 * It uses the error caught from from http requests to provide an unique error interface for the
 * components to display the error or act upon it.
 */
export class UiError {

  /**
   * Associated Error Code.
   * If the error does not comes from the Gazebo server, the status code is used.
   */
  public code: number;

  /**
   * The human-readable error message.
   */
  public message: string;

  /**
   * @param httpResponse The HttpErrorResponse caught in the http requests.
   */
  constructor(httpResponse: HttpErrorResponse) {
    // Check if the error comes from the Gazebo server.
    if (httpResponse.error.errcode) {
      this.code = httpResponse.error.errcode;
      this.message = `Error #${httpResponse.error.errcode}: ${httpResponse.error.msg}`;
    } else {
      // Check if it's an authentication error.
      if (httpResponse.status === 401 && httpResponse.error === 'Token is expired\n') {
        this.message = 'Your session expired. Please log in again';
      } else {
        this.message = httpResponse.statusText;
      }
      this.code = httpResponse.status;
    }
  }
}
