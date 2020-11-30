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
import { PortalService, Registration, PaginatedRegistration } from '../portal';
import { Organization } from '../organization';

describe('PortalService', () => {
  let injector: TestBed;
  let service: PortalService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Test Registration.
  const testRegistrationJson = {
    competition: 'testCompetition',
    creator: 'testCreator',
    participant: 'testOrg',
  };
  const testRegistration = new Registration(testRegistrationJson);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        PortalService,
      ],
    });
    injector = getTestBed();
    service = injector.inject(PortalService);
    httpMock = injector.inject(HttpTestingController);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should get a list of portals', () => {
    // TODO(german-mas): This returns fake data, intended to be used as a placeholder.
    // See https://app.asana.com/0/882898012818972/928371086237573/f
    service.getList().subscribe(
      (portals) => {
        expect(portals.length).toBe(1);
        expect(portals[0].name).toEqual('SubT');
        expect(portals[0].owner).toEqual('DARPA');
      }
    );
  });

  it('should get a single portal', () => {
    // TODO(german-mas): This returns fake data, intended to be used as a placeholder.
    // See https://app.asana.com/0/882898012818972/928371086237573/f
    service.get('testOwner', 'testName').subscribe(
      (portal) => {
        expect(portal.owner).toEqual('DARPA');
        expect(portal.name).toEqual('SubT');
      }
    );
  });

  it('should send a registration request', () => {
    const url = `${service.baseUrl}/subt/registrations`;
    service.sendRegistrationRequest('orgName').subscribe(
      (reg) => {
        expect(reg).toEqual(testRegistration);
      }
    );
    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ participant: 'orgName'});
    req.flush(testRegistrationJson);
  });

  it('should get registration requests', () => {
    // No specific page.
    let url = `${service.baseUrl}/subt/registrations?status=pending&per_page=10`;
    service.getRegistrationRequests('pending').subscribe(
      (paginatedRegistration) => {
        expect(paginatedRegistration.registrations).toEqual([testRegistration]);
      }
    );
    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testRegistrationJson]);

    // With a particular page.
    const status = 'rejected';
    const page = 2;
    url = `${service.baseUrl}/subt/registrations?status=${status}&per_page=10&page=${page}`;
    service.getRegistrationRequests(status, page).subscribe(
      (paginatedRegistration) => {
        expect(paginatedRegistration.registrations).toEqual([testRegistration]);
      }
    );
    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testRegistrationJson]);
  });

  it('should modify a registration', () => {
    const orgName = 'testOrg';
    const url = `${service.baseUrl}/subt/registrations/subt/${orgName}`;
    // Approval.
    service.modifyRegistration(orgName, true).subscribe(
      (reg) => {
        expect(reg).toEqual(testRegistration);
      }
    );
    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    req.flush(testRegistrationJson);
    // Reject.
    service.modifyRegistration(orgName, false).subscribe(
      (reg) => {
        expect(reg).toEqual(testRegistration);
      }
    );
    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    req.flush(testRegistrationJson);
  });

  it('should get a list of participants', () => {
    const url = `${service.baseUrl}/subt/participants?per_page=10`;
    const testParticipantJson = {
      name: 'testOrg'
    };
    service.getParticipants().subscribe(
      (participants) => {
        expect(participants.organizations).toEqual([new Organization(testParticipantJson)]);
      }
    );
    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testParticipantJson]);
  });

  it('should parse the link header of a paginated response', () => {
    const url = `${service.baseUrl}/subt/registrations?status=pending&per_page=10`;
    const header: HttpHeaders = new HttpHeaders({link: '</registrations?page=2>; rel="next"'});
    service.getRegistrationRequests('pending').subscribe(
      (paginatedRegistrations) => {
        expect(paginatedRegistrations.hasNextPage()).toBe(true);
        expect(paginatedRegistrations.registrations).toEqual([testRegistration]);
      }
    );
    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testRegistrationJson], {headers: header});
  });
});
