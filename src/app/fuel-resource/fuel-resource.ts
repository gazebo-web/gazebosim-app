import { Image } from '../model/image';
import { License } from '../model/license';
import { Metadatum } from '../metadata';

/**
 * A class that represents a Fuel resource, such as a world or a model.
 */
export abstract class FuelResource {

  /**
   * The file extensions allowed by the resource.
   */
  public static allowedExtensions: string[] = [];

  /**
   * The human-readable name of the resource.
   */
  public name: string;

  /**
   * An identifier of the resource type, used to build URLs.
   */
  public type: string;

  /**
   * Description of the resource.
   */
  public description: string;

  /**
   * The entity who uploaded the resource.
   */
  public owner: string;

  /**
   * The permission of the resource.
   */
  public permission: number;

  /**
   * Whether the resource is private or not.
   */
  public private: boolean;

  /**
   * Weight of the resource as a zip file.
   */
  public filesize: number;

  /**
   * Number of likes the resource has.
   */
  public likes: number;

  /**
   * Whether the resource is liked or not.
   */
  public isLiked: boolean;

  /**
   * Number of downloads the resource has.
   */
  public downloads: number;

  /**
   * The date the resource has been uploaded for the first time.
   */
  public uploadDate: Date;

  /**
   * The date the resource has been modified.
   */
  public modifyDate: Date;

  /**
   * Array of Tags the resource has.
   */
  public tags: string[] = [];

  /**
   * Array of Categories the resource has.
   */
  public categories: string[] = [];

  /**
   * Array of Versions of the resource.
   */
  public versions: number[] = [];

  /**
   * Images belonging to the resource.
   */
  public images: Image[];

  /**
   * Contains the Files of the resource.
   */
  public files: any;

  /**
   * The license of the resource.
   */
  public license: License;

  /**
   * A resource can have metadata that consists in arbitrary key-value pairs.
   */
  public metadata: Metadatum[] = [];

  /**
   * @param json A JSON that contains the required fields of the resource.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.description = json['description'];
    this.owner = json['owner'];
    this.permission = json['permission'];
    this.private = json['private'];
    this.filesize = json['filesize'];
    this.likes = json['likes'];
    this.isLiked = json['is_liked'];
    this.downloads = json['downloads'];
    this.uploadDate = json['upload_date'];
    if (!json['modify_date']) {
      this.modifyDate = this.uploadDate;
    } else {
      this.modifyDate = json['modify_date'];
    }
    if (json['tags']) {
      this.tags = json['tags'];
    }
    if (json['categories']) {
      this.categories = json['categories'];
    }
    if (json['version']) {
      for (let v = 1; v <= json['version']; v++) {
        this.versions.push(v);
      }
    }
    if (json['metadata']) {
      this.metadata = json['metadata'];
    }

    this.images = [];
    this.files = [];
    this.license = new License(json);

    // Append the given Thumbnail URL to the images.
    if (json['thumbnail_url']) {
      const image = new Image();
      image.url = `${API_HOST}/${API_VERSION}${json['thumbnail_url']}`;
      this.images.push(image);
    }
  }

  /**
   * Populates the images with the files inside the /thumbnails folder.
   * This replaces the contents of the resource's images.
   *
   * Only PNG and JPG files are accepted.
   *
   * @param baseUrl The base URL of the resource, obtained from the service.
   */
  public populateThumbnails(baseUrl: string): void {
    this.images = [];
    for (const file of this.files) {
      if ((file['path'].substring(0, 11) === '/thumbnails') &&
          ((/\.(jpg|png)$/i).test(file['name']))) {
        const image = new Image();
        image.url = `${baseUrl}/files${file['path']}`;
        this.images.push(image);
      }
    }
  }

  /**
   * Return a specific image at a given index.
   *
   * @param index Index of the image to get.
   * @returns The image at the given index.
   */
  public getImageAt(index: number): Image {
    return this.images[index];
  }

  /**
   * Check if the resource has a thumbnail to display.
   *
   * @returns A boolean whether the resource contains a thumbnail or not.
   */
  public hasThumbnail(): boolean {
    return this.images && this.images.length !== 0;
  }

  /**
   * Get the resource's thumbnail to display.
   *
   * @returns The thumbnail image.
   */
  public getThumbnail(): Image {
    return this.getImageAt(0);
  }

  /**
   * Returns whether the resource has metadata or not.
   */
  public hasMetadata(): boolean {
    return this.metadata && this.metadata.length !== 0;
  }
}
