import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { User, UserService } from '../user';

describe('UserService', () => {
  let auth: AuthService;
  let service: UserService;
  let factory: JsonClassFactoryService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Test User as Json.
  const testUserJsonA = {
    username: 'testUserA',
    name: 'The Test User A',
  };

  // Test User instances.
  const testUserA: User = new User(testUserJsonA);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        UserService,
      ],
    });

    auth = TestBed.inject(AuthService);
    service = TestBed.inject(UserService);
    factory = TestBed.inject(JsonClassFactoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should get a single user', () => {
    const username: string = 'testUserA';
    const testUrl: string = `${service.baseUrl}/users/${username}`;

    service.getUser(username).subscribe(
      (user) => {
        expect(user).toEqual(testUserA);
      });
    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testUserJsonA);
  });

  it('should delete a user', () => {
    const username: string = 'testUserA';
    const testUrl: string = `${service.baseUrl}/users/${username}`;

    service.deleteUser(testUserA.username).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush('');
  });
});
