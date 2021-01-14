import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest
} from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../auth/auth.service';
import { FuelPaginatedResource } from './fuel-paginated-resource';
import { FuelResource } from './fuel-resource';
import { FuelResourceService } from './fuel-resource.service';
import { JsonClassFactoryService } from '../factory/json-class-factory.service';

describe('FuelResourceService', () => {
  // Injector and related services.
  let authService: AuthService;
  let factoryService: JsonClassFactoryService;
  let service: FuelResourceService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Test data.
  const user = 'test-username';
  const name = 'test-name';
  const formData = new FormData();
  formData.append('name', 'test-name');
  const testResource: FuelResource = {owner: user, name} as FuelResource;

  // Executed before each spec. Set up the testing Module.
  // Done this way by Angular design. The module is internally reset after
  // each spec.
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        AuthService,
        JsonClassFactoryService,
        FuelResourceService,
      ],
    });

    authService = TestBed.inject(AuthService);
    factoryService = TestBed.inject(JsonClassFactoryService);
    service = TestBed.inject(FuelResourceService);
    httpMock = TestBed.inject(HttpTestingController);

    service.paginatedResourceClass = FuelPaginatedResource;
    service.resourceClass = FuelResource;
    service.resourceType = 'fuelResource';
  });

  // Executed after each spec. Makes sure all the HTTP requests were handled.
  afterEach(() => {
    httpMock.verify();
  });

  it(`should get a list of resources`, () => {
    // No search params.
    let url: string = `${service.baseUrl}/${service.resourceType}`;
    service.getList().subscribe(
      (response) => {
        expect(response.resources[0].name).toBe(testResource.name);
      }
    );

    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource]);

    // With search params.
    const search = 'test';
    url += `?q=${search}`;
    service.getList(search).subscribe(
      (response) => {
        expect(response.resources[0].name).toBe(testResource.name);
      }
    );

    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource]);
  });

  it(`should get a list of resources owned by someone`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}`;
    service.getOwnerList(user).subscribe(
      (response) => {
        expect(response.resources[0].name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource]);
  });

  it(`should get a list of resources liked by someone`, () => {
    const url = `${service.baseUrl}/${user}/likes/${service.resourceType}`;
    service.getUserLikedList(user).subscribe(
      (response) => {
        expect(response.resources[0].name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource]);
  });

  it(`should get the next page of a paginated resource`, () => {
    const url = `nextPageUrl`;
    service.getNextPage({nextPage: 'nextPageUrl'} as FuelPaginatedResource).subscribe(
      (response) => {
        expect(response.resources[0].name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource]);
  });

  it(`should get a single resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}`;
    service.get(user, name).subscribe(
      (response) => {
        expect(response.name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(testResource);
  });

  it(`should upload a resource`, () => {
    const url = `${service.baseUrl}/${service.resourceType}`;
    service.upload(formData).subscribe(
      (response) => {
        expect(response.body).toEqual(testResource);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);
    req.flush(testResource);
  });

  it(`should edit a resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}`;
    service.edit(user, name, formData).subscribe(
      (response) => {
        expect(response.name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(formData);
    req.flush(testResource);
  });

  it(`should delete a resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}`;
    service.delete({owner: user, name} as FuelResource).subscribe(
      (response) => {
        expect(response.name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    req.flush(testResource);
  });

  it(`should like a resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/likes`;
    service.like(testResource).subscribe(
      (response) => {
        expect(response).toBe(1);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    req.flush(1);
  });

  it(`should unlike a resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/likes`;
    service.unlike(testResource).subscribe(
      (response) => {
        expect(response).toBe(0);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('DELETE');
    req.flush(0);
  });

  it(`should copy a resource`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/clone`;
    const copyFormData = new FormData();
    copyFormData.append('name', 'newName');
    copyFormData.append('owner', 'newOwner');
    service.copy(testResource, 'newName', 'newOwner').subscribe(
      (response) => {
        expect(response.name).toBe(testResource.name);
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(copyFormData);
    req.flush(testResource);
  });

  it(`should download a resource as a Zip file`, () => {
    // No version.
    let url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/tip/${name}.zip`;
    service.download(testResource).subscribe(
      (response) => {
        expect(response).toEqual(new Blob([]));
      }
    );

    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob([]));

    // A specific version.
    const version = 1;
    url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/${version}/${name}.zip`;
    service.download(testResource, version).subscribe(
      (response) => {
        expect(response).toEqual(new Blob([]));
      }
    );

    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob([]));
  });

  it(`should get a file as a blob`, () => {
    const url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/tip/files/filename`;
    service.getFileAsBlob(url).subscribe(
      (response) => {
        expect(response).toEqual(new Blob([]));
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob([]));
  });

  it(`should get the file tree of a resource`, () => {
    // No version.
    let url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/tip/files`;
    service.getFileTree(testResource).subscribe();

    let req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({});

    // A specific version.
    const version = 1;
    url = `${service.baseUrl}/${user}/${service.resourceType}/${name}/${version}/files`;
    service.getFileTree(testResource, version).subscribe();

    req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it(`should get the URL of a resource's file`, () => {
    const baseUrl = `${service.baseUrl}/${user}/${service.resourceType}/${name}`;
    const file = new File([], 'fileName');
    file['path'] = '/path/to/file';

    // No version.
    let url = `${baseUrl}/tip/files${file['path']}`;
    let result = service.getIndividualFileUrl(testResource, file);
    expect(result).toBe(url);

    // A specific version.
    const version = 1;
    url = `${baseUrl}/${version}/files${file['path']}`;
    result = service.getIndividualFileUrl(testResource, file, version);
    expect(result).toBe(url);
  });

  it(`should handle the link header`, () => {
    const header: HttpHeaders = new HttpHeaders({link: '</test-next?page=1>; rel="next"'});
    const url: string = `${service.baseUrl}/${service.resourceType}`;
    service.getList().subscribe(
      (response) => {
        expect(response.hasNextPage()).toBe(true);
        expect(response.nextPage).toContain('/test-next?page=1');
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([testResource], {headers: header});
  });

  it(`should throw a UiError`, () => {
    const url: string = `${service.baseUrl}/${service.resourceType}`;
    spyOn(console, 'error');

    service.getList().subscribe(
      (response) => {
        // There won't be a response in this spec, only an error.
        expect(response).toBeUndefined();
      },
      (error) => {
        expect(error.message).toBe('test-error');
        expect(error.code).toBe(400);
        expect(console.error).toHaveBeenCalled();
      }
    );

    const req: TestRequest = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush({error: 'test-error'}, {status: 400, statusText: 'test-error'});
  });
});
