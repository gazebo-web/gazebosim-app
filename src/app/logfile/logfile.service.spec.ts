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
import { Logfile, LogfileService, PaginatedLogfile } from '../logfile';

describe('LogfileService', () => {
  let injector: TestBed;
  let service: LogfileService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Test Logfile.
  const testLogfileJson = {
    id: 1,
    name: 'testName',
    owner: 'testOwner',
  };

  // Test Logfile instances.
  const testLogfile: Logfile = new Logfile(testLogfileJson);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        LogfileService,
      ],
    });
    injector = getTestBed();
    service = injector.inject(LogfileService);
    httpMock = injector.inject(HttpTestingController);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should get a single logfile', () => {
    const url = `${service.baseUrl}/subt/logfiles/${testLogfile.id}`;

    service.getLogfile(testLogfile.id).subscribe(
      (logfile) => {
        expect(logfile).toEqual(testLogfile);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(testLogfileJson);
  });

  it('should get a list of logfiles', () => {
    // No specific page.
    let url = `${service.baseUrl}/subt/logfiles?status=pending&per_page=10`;
    service.getList('pending').subscribe(
      (paginatedLogfiles) => {
        expect(paginatedLogfiles.logfiles).toEqual([testLogfile]);
      }
    );

    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testLogfileJson]);

    // A particular page.
    const status = 'rejected';
    const page = 2;
    url = `${service.baseUrl}/subt/logfiles?status=${status}&per_page=10&page=${page}`;
    service.getList(status, page).subscribe(
      (paginatedLogfiles) => {
        expect(paginatedLogfiles.logfiles).toEqual([testLogfile]);
      }
    );

    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testLogfileJson]);
  });

  it('should correctly parse the Link header of a paginated response', () => {
    const status = 'pending';
    const url = `${service.baseUrl}/subt/logfiles?status=${status}&per_page=10`;
    const header: HttpHeaders = new HttpHeaders({link: '</logfiles?page=2>; rel="next"'});

    service.getList(status).subscribe(
      (paginatedLogfiles) => {
        expect(paginatedLogfiles.hasNextPage()).toBe(true);
        expect(paginatedLogfiles.logfiles).toEqual([testLogfile]);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testLogfileJson], {headers: header});
  });

  it('should get a list of logfiles with a status', () => {
    const url = `${service.baseUrl}/subt/logfiles?status=pending&per_page=10`;

    service.getList('pending').subscribe(
      (paginatedLogfiles) => {
        expect(paginatedLogfiles.logfiles).toEqual([testLogfile]);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testLogfileJson]);
  });

  it('should upload a logfiles', () => {
    const url = `${service.baseUrl}/subt/logfiles`;
    const file = new File([], 'filename');
    file['fullPath'] = 'path';

    const formData = new FormData();
    formData.append('owner', testLogfile.owner);
    formData.append('private', 'true');
    formData.append('file', file, (file as any).fullPath);

    service.upload(formData).subscribe(
      (logfile) => {
        expect(logfile).toEqual(testLogfile);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);
    req.flush(testLogfileJson);
  });

  it('should modify a logfile', () => {
    const url = `${service.baseUrl}/subt/logfiles/${testLogfile.id}`;
    const data = {
      status: 1,
      score: 150,
    };

    service.modify(testLogfile.id, data).subscribe(
      (logfile) => {
        expect(logfile).toEqual(testLogfile);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(data);
    req.flush(testLogfileJson);
  });

  it('should remove a logfile', () => {
    const url = `${service.baseUrl}/subt/logfiles/${testLogfile.id}`;

    service.remove(testLogfile.id).subscribe(
      (logfile) => {
        expect(logfile).toEqual(testLogfile);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    req.flush(testLogfileJson);
  });

  it('should download a logfile', () => {
    const url = `${service.baseUrl}/subt/logfiles/${testLogfile.id}/file?link=true`;
    const blob = new Blob([]);

    service.download(testLogfile.id).subscribe(
      (logfile) => {
        expect(logfile).toEqual(blob);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(testLogfileJson);
  });

  it('should get the next page of logfiles', () => {
    const paginatedLogfile = new PaginatedLogfile();
    paginatedLogfile.nextPage = `next-page-url`;
    paginatedLogfile.logfiles = [testLogfile];

    service.getNextPage(paginatedLogfile).subscribe(
      (paginatedLogfileResponse) => {
        expect(paginatedLogfileResponse.logfiles).toEqual([testLogfile]);
      }
    );

    const req: TestRequest = httpMock.expectOne(paginatedLogfile.nextPage);
    expect(req.request.method).toBe('GET');
    req.flush([testLogfileJson]);
  });
});
