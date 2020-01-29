import { HttpErrorResponse } from '@angular/common/http';
import { UiError } from './ui-error';

describe('UiError', () => {

  it('should have the error code and message of the Ign server error', () => {
    const mockServerError = {
      errcode: 1000,
      msg: 'Error from the Ign Server'
    };

    const response = new HttpErrorResponse({
      error: mockServerError,
      status: 400,
      statusText: 'Bad Request'
    });

    const uiError = new UiError(response);

    expect(uiError.code).toBe(1000);
    expect(uiError.message).toBe('Error #1000: Error from the Ign Server');
  });

  it(`should have the status code and text if the error doesn't comes from the Ign server`, () => {
    const response = new HttpErrorResponse({
      error: 'Not an Ign server error',
      status: 400,
      statusText: 'Bad Request'
    });

    const uiError = new UiError(response);

    expect(uiError.code).toBe(400);
    expect(uiError.message).toBe('Bad Request');
  });

  it(`should have a custom message on authorization error if the token is expired`, () => {
    const response = new HttpErrorResponse({
      error: 'Token is expired\n',
      status: 401,
      statusText: 'Unauthorized'
    });

    const uiError = new UiError(response);

    expect(uiError.code).toBe(401);
    expect(uiError.message).not.toBe('Unauthorized');
  });
});
