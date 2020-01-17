import { FuelResource } from './fuel-resource';
import { Image } from '../model/image';

// As the FuelResource class is abstract, we create a stub for test purposes.
class FuelResourceStub extends FuelResource {}

describe('FuelResource', () => {

  // The resource to use.
  let res: FuelResource;
  const testFiles = [
    {
      name: 'file1.png',
      path: '/thumbnails/file1.png'
    },
    {
      name: 'file2.jpg',
      path: '/thumbnails/file2.jpg'
    },
    {
      name: 'model.sdf',
      path: '/model.sdf'
    },
  ];

  it(`should set the modified date`, () => {
    const date = new Date(2019, 1, 1);

    res = new FuelResourceStub({ modify_date: date });
    expect(res.modifyDate).toBe(date);

    res = new FuelResourceStub({ upload_date: date });
    expect(res.modifyDate).toBe(date);
  });

  it(`should populate the available versions`, () => {
    // Array of versions
    const version = 4;
    res = new FuelResourceStub({ version });
    expect(res.versions.length).toBe(version);

    // No versions
    res = new FuelResourceStub({});
    expect(res.versions).toEqual([]);
  });

  it(`should populate the images of the resource`, () => {
    const baseUrl = 'testUrl';
    res = new FuelResourceStub({});
    expect(res.files.length).toBe(0);
    expect(res.images.length).toBe(0);

    // Populate files and thumbnails.
    res.files = testFiles;
    res.populateThumbnails(baseUrl);
    expect(res.images.length).toBe(2);
    expect(res.images[0].url).toBe('testUrl/files/thumbnails/file1.png');
    expect(res.images[1].url).toBe('testUrl/files/thumbnails/file2.jpg');
  });

  it(`should get an image at a certain position`, () => {
    res = new FuelResourceStub({});
    res.files = testFiles;
    res.populateThumbnails('');

    let img: Image;
    img = res.getImageAt(0);
    expect(img.url.endsWith('file1.png')).toBe(true);

    img = res.getImageAt(1);
    expect(img.url.endsWith('file2.jpg')).toBe(true);
  });

  it(`should populate a thumbnail on the constructor if available`, () => {
    const thumbnailUrl = 'files/thumbnails/1.png';
    res = new FuelResourceStub({ thumbnail_url: thumbnailUrl });
    expect(res.images.length).toBe(1);
    expect(res.images[0].url.endsWith(thumbnailUrl)).toBe(true);
  });

  it(`should return whether there is a thumbnail or not`, () => {
    res = new FuelResourceStub({});
    let result: boolean;
    result = res.hasThumbnail();
    expect(result).toBe(false);

    const thumbnail = new Image();
    res.images.push(thumbnail);
    result = res.hasThumbnail();
    expect(result).toBe(true);
  });

  it(`should return the thumbnail`, () => {
    res = new FuelResourceStub({});
    spyOn(res, 'getImageAt');
    res.getThumbnail();
    expect(res.getImageAt).toHaveBeenCalledWith(0);
  });
});
