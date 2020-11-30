import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpHeaders } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { JsonClassFactoryService } from '../factory/json-class-factory.service';
import { Collection, PaginatedCollection, CollectionService } from '../collection';
import { Model } from '../model/model';
import { World } from '../world/world';

describe('CollectionService', () => {
  let testBed: TestBed;
  let service: CollectionService;
  let factory: JsonClassFactoryService;

  // The injectable HttpTestingController allows mocking and flushing requests.
  let httpMock: HttpTestingController;

  // Collection resources.
  const testModels: Model[] = [new Model({})];
  const testWorlds: World[] = [new World({})];

  // Test Collection as Json.
  const testCollectionJsonA = {
    owner: 'test-col-a-owner',
    name: 'test-col-a-name',
    description: 'test-col-a-desc',
    thumbnails: [],
    models: testModels,
    worlds: testWorlds
  };

  const testCollectionJsonB = {
    owner: 'test-col-b-owner',
    name: 'test-col-b-name',
    description: 'test-col-b-desc',
    thumbnails: [],
    models: testModels,
    worlds: testWorlds
  };

  const testCollectionListJson = [
    testCollectionJsonA,
    testCollectionJsonB
  ];

  // Test Collection instances.
  const testCollectionA: Collection = new Collection(testCollectionJsonA);
  const testCollectionB: Collection = new Collection(testCollectionJsonB);
  const testCollectionList: Collection[] = [testCollectionA, testCollectionB];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        JsonClassFactoryService,
        CollectionService,
      ],
    });
    testBed = getTestBed();
    service = testBed.inject(CollectionService);
    factory = testBed.inject(JsonClassFactoryService);
    httpMock = testBed.inject(HttpTestingController);
  });

  // After each test, verify that all the requests were consumed.
  afterEach(() => {
    httpMock.verify();
  });

  it('should get the list of collections', () => {
    const testUrl: string = `${service.baseUrl}/collections`;

    service.getCollectionList().subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual(testCollectionList);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson);
  });

  it('should get the list of collections with partial search', () => {
    const testUrl: string = `${service.baseUrl}/collections?q=:noft:test`;

    service.getCollectionList('test').subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual(testCollectionList);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson);
  });

  it('should get the list of collections that can be extended by an user', () => {
    const testUrl: string = `${service.baseUrl}/collections?extend=true`;

    service.getCollectionExtensibleList().subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual(testCollectionList);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson);
  });

  it('should get the list of extensible collections along with a partial search', () => {
    const testUrl: string = `${service.baseUrl}/collections?extend=true&q=:noft:partial`;

    service.getCollectionExtensibleList('partial').subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual(testCollectionList);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson);
  });

  it('should get the list of collections owned by an entity', () => {
    const owner: string = 'test-col-a-owner';
    const testUrl: string = `${service.baseUrl}/${owner}/collections`;

    service.getOwnerCollectionList(owner).subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual([testCollectionA]);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush([testCollectionJsonA]);
  });

  it('should get a single collection', () => {
    const name: string = 'test-col-a-name';
    const owner: string = 'test-col-a-owner';

    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}`;

    service.getCollection(owner, name).subscribe(
      (collection) => {
        expect(collection).toEqual(testCollectionA);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionJsonA);
  });

  it('should get the list of models of a collection', () => {
    const owner: string = 'test-col-a-owner';
    const name: string = 'test-col-a-name';
    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}/models`;

    service.getCollectionModels(owner, name).subscribe(
      (paginatedModels) => {
        expect(paginatedModels.resources).toEqual(testModels);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testModels);
  });

  it('should get the list of worlds of a collection', () => {
    const owner: string = 'test-col-a-owner';
    const name: string = 'test-col-a-name';
    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}/worlds`;

    service.getCollectionWorlds(owner, name).subscribe(
      (paginatedWorlds) => {
        expect(paginatedWorlds.resources).toEqual(testWorlds);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testWorlds);
  });

  it('should add an asset to a collection', () => {
    const owner: string = 'test-col-a-owner';
    const name: string = 'test-col-a-name';
    const resource = testModels[0];

    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}/${resource.type}`;

    service.addAsset(owner, name, resource).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('POST');
    req.flush('');
  });

  it('should remove an asset to a collection', () => {
    const owner: string = 'test-col-a-owner';
    const name: string = 'test-col-a-name';
    const resource = testModels[0];

    let testUrl: string;
    testUrl = `${service.baseUrl}/${owner}/collections/${name}/${resource.type}`;
    testUrl += `?n=${resource.name}&o=${resource.owner}`;

    service.removeAsset(owner, name, resource).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush('');
  });

  it('should get the collections that have an asset', () => {
    const resource = testModels[0];

    let testUrl: string;
    testUrl = `${service.baseUrl}/${resource.owner}/${resource.type}/${resource.name}/collections`;

    service.getAssetCollections(resource).subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.collections).toEqual(testCollectionList);
      }
    );

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionList);
  });

  it('should create a collection', () => {
    const testUrl: string = `${service.baseUrl}/collections`;

    service.createCollection(testCollectionJsonA).subscribe(
      (collection) => {
        expect(collection).toEqual(testCollectionA);
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('POST');
    req.flush(testCollectionJsonA);
  });

  it('should edit a collection', () => {
    const name = 'test-col-a-name';
    const owner = 'test-col-a-owner';

    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}`;

    const toEdit = new FormData();
    toEdit.append('description', 'new-desc');

    service.editCollection(owner, name, toEdit).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(toEdit);
    req.flush('');
  });

  it('should delete a collection', () => {
    const name = 'test-col-a-name';
    const owner = 'test-col-a-owner';

    const testUrl: string = `${service.baseUrl}/${owner}/collections/${name}`;

    service.deleteCollection(owner, name).subscribe();

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush('');
  });

  it('should get the next page of a paginated collection', () => {
    const paginatedCollection = new PaginatedCollection();
    paginatedCollection.collections = testCollectionList;
    paginatedCollection.nextPage = `nextPage`;

    service.getNextPage(paginatedCollection).subscribe(
      (response) => {
        expect(response.collections).toEqual(testCollectionList);
      }
    );

    const req: TestRequest = httpMock.expectOne(paginatedCollection.nextPage);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionList);
  });

  it(`should parse the next pagination url if it's present in the headers`, () => {
    // Fake Link Header.
    const header: HttpHeaders = new HttpHeaders({link: '</collections?page=2>; rel="next"'});
    const testUrl: string = `${service.baseUrl}/collections`;

    service.getCollectionList().subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.hasNextPage()).toBe(true);
        expect(paginatedCollection.nextPage).toContain('/collections?page=2');
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson, {headers: header});
  });

  it(`should NOT parse the next pagination url if it's NOT present in the headers`, () => {
    // Fake Link Header.
    const header: HttpHeaders = new HttpHeaders();
    const testUrl: string = `${service.baseUrl}/collections`;

    service.getCollectionList().subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.hasNextPage()).toBe(false);
        expect(paginatedCollection.nextPage).toBeNull();
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson, {headers: header});
  });

  it(`should NOT parse the next pagination url if the link is empty`, () => {
    // Fake Header with an empty Link.
    const header: HttpHeaders = new HttpHeaders({link: ''});
    const testUrl: string = `${service.baseUrl}/collections`;

    service.getCollectionList().subscribe(
      (paginatedCollection) => {
        expect(paginatedCollection.hasNextPage()).toBe(false);
        expect(paginatedCollection.nextPage).toBeNull();
      });

    const req: TestRequest = httpMock.expectOne(testUrl);
    expect(req.request.method).toBe('GET');
    req.flush(testCollectionListJson, {headers: header});
  });
});
