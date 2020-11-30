import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpHeaders } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Organization, PaginatedOrganizations, OrganizationService } from '../organization';
import { User } from '../user';

describe('OrganizationService', () => {
  let auth: AuthService;
  let service: OrganizationService;
  let factory: JsonClassFactoryService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Test Organizations as Json.
  const testOrganizationJsonA = {
    name: 'name-test-a',
    description: 'desc-test-a'
  };

  const testOrganizationJsonB = {
    name: 'name-test-b',
    description: 'desc-test-b'
  };

  const testOrganizationListJson = [
    testOrganizationJsonA,
    testOrganizationJsonB
  ];

  // Test Organization instances.
  const testOrganizationA: Organization = new Organization(testOrganizationJsonA);
  const testOrganizationB: Organization  = new Organization(testOrganizationJsonB);
  const testOrganizationList: Organization[] = [testOrganizationA, testOrganizationB];

  // Test User.
  const testUserJson = {
    name: 'Test User',
    username: 'testUser',
    organizations: []
  };
  const testUser: User = new User(testUserJson);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        OrganizationService,
      ],
    });

    auth = TestBed.inject(AuthService);
    service = TestBed.inject(OrganizationService);
    factory = TestBed.inject(JsonClassFactoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should get the list of organizations', () => {
    const testUrl: string = `${service.baseUrl}/organizations`;

    service.getPublicOrganizations().subscribe(
      (paginatedOrganizations) => {
        expect(paginatedOrganizations.organizations).toEqual(testOrganizationList);
      });
    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testOrganizationListJson);
  });

  it('should get a single organization', () => {
    const orgName: string = 'name-test-a';
    const testUrl: string = `${service.baseUrl}/organizations/${orgName}`;

    service.getOrganization(orgName).subscribe(
      (organization) => {
        expect(organization).toEqual(testOrganizationA);
      });
    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testOrganizationJsonA);
  });

  it('should create an organization', () => {
    const testUrl: string = `${service.baseUrl}/organizations`;

    service.createOrganization(testOrganizationJsonA).subscribe(
      (organization) => {
        expect(organization).toEqual(testOrganizationA);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('POST');
    req.flush(testOrganizationJsonA);
  });

  it('should edit an organization', () => {
    const orgName: string = testOrganizationA.name;
    const testUrl: string = `${service.baseUrl}/organizations/${orgName}`;

    const toEdit = {
      desc: 'new-desc'
    };

    service.editOrganization(testOrganizationA, toEdit).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(toEdit);
    req.flush('');
  });

  it('should delete an organization', () => {
    const orgName: string = testOrganizationA.name;
    const testUrl: string = `${service.baseUrl}/organizations/${orgName}`;

    service.deleteOrganization(testOrganizationA).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush('');
  });

  it('should add a user to an organization', () => {
    const orgName: string = testOrganizationA.name;
    const testUrl: string = `${service.baseUrl}/organizations/${orgName}/users`;

    const body = {
      username: testUser.username,
      role: 'member'
    };

    service.addUserToOrganization(testOrganizationA, testUser.username, 'member').subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(testUserJson);
  });

  it('should remove a user from an organization', () => {
    const orgName: string = testOrganizationA.name;
    const username: string = testUser.username;
    const testUrl: string = `${service.baseUrl}/organizations/${orgName}/users/${username}`;

    service.removeUserFromOrganization(testOrganizationA, username).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush(testUserJson);
  });

  it(`should parse the next pagination url if it's present in the headers`, () => {
    // Fake Link Header.
    const header: HttpHeaders = new HttpHeaders({link: '</organizations?page=2>; rel="next"'});
    const testUrl: string = `${service.baseUrl}/organizations`;

    service.getPublicOrganizations().subscribe(
      (paginatedOrganizations) => {
        expect(service.hasNextUrl()).toBe(true);
        expect(service.nextUrl).toContain('/organizations?page=2');
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testOrganizationListJson, {headers: header});
  });

  it(`should NOT parse the next pagination url if it's NOT present in the headers`, () => {
    // Fake Link Header.
    const header: HttpHeaders = new HttpHeaders();
    const testUrl: string = `${service.baseUrl}/organizations`;

    service.getPublicOrganizations().subscribe(
      (paginatedOrganizations) => {
        expect(service.hasNextUrl()).toBe(false);
        expect(service.nextUrl).toBeNull();
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testOrganizationListJson, {headers: header});
  });

  it(`should NOT parse the next pagination url if the link is empty`, () => {
    // Fake Header with an empty Link.
    const header: HttpHeaders = new HttpHeaders({link: ''});
    const testUrl: string = `${service.baseUrl}/organizations`;

    service.getPublicOrganizations().subscribe(
      (paginatedOrganizations) => {
        expect(service.hasNextUrl()).toBe(false);
        expect(service.nextUrl).toBeNull();
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testOrganizationListJson, {headers: header});
  });
});
