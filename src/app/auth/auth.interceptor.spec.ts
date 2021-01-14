import { TestBed, getTestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';

import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let testBed: TestBed;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ]
    });
    testBed = getTestBed();
    httpMock = testBed.inject(HttpTestingController);
    http = testBed.inject(HttpClient);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should add an Authorization header', () => {
    // Note: This is fake route.
    const url = '/';

    // Mock the local storage.
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'token') {
        return 'test-token';
      }
    });

    http.get(url).subscribe();

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush('');
  });

  it('should NOT add an Authorization header if there is no token', () => {
    // Note: This is fake route.
    const url = '/';

    // Mock the local storage.
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      if (key === 'token') {
        return null;
      }
    });

    http.get(url).subscribe();

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush('');
  });
});
