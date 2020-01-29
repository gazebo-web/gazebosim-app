import { Collection } from './collection';

describe('Collection', () => {

  it('should build the collection with the json data', () => {
    // No thumbnails.
    const data = {
      name: 'testCollection',
      owner: 'testOwner',
      description: 'testDescription',
    };

    const collection = new Collection(data);

    expect(collection.name).toBe('testCollection');
    expect(collection.owner).toBe('testOwner');
    expect(collection.description).toBe('testDescription');
    expect(collection.thumbnails).toBeDefined();
    expect(collection.thumbnails.length).toEqual(0);
  });

  it('should build the collection with thumbnails', () => {
    // With thumbnails.
    const data = {
      name: 'testCollection',
      owner: 'testOwner',
      description: 'testDescription',
      thumbnails: ['/testImg0', '/testImg1', '/testImg2']
    };

    const collection = new Collection(data);

    expect(collection.name).toBe('testCollection');
    expect(collection.owner).toBe('testOwner');
    expect(collection.description).toBe('testDescription');
    expect(collection.thumbnails).toBeDefined();
    expect(collection.thumbnails.length).toEqual(3);
    expect(collection.thumbnails[0].url).toContain('/testImg0');
    expect(collection.thumbnails[1].url).toContain('/testImg1');
    expect(collection.thumbnails[2].url).toContain('/testImg2');
  });

  it('should return if the collection has a thumbnail', () => {
    let collection = new Collection({});
    expect(collection.hasThumbnail()).toBe(false);

    collection = new Collection({thumbnails: ['/testImg0']});
    expect(collection.hasThumbnail()).toBe(true);
  });

  it('should return the thumbnail of the collection', () => {
    const collection = new Collection({thumbnails: ['/testImg0', '/testImg1']});
    expect(collection.getThumbnail().url).toContain('/testImg0');
  });
});
