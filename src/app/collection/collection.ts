import { Model } from '../model/model';
import { World } from '../world/world';
import { Image } from '../model/image';
import { environment } from '../../environments/environment';

/**
 * A class that represents a Collection.
 */
export class Collection {

  /**
   * The name of the collection.
   */
  public name: string;

  /**
   * The owner of the given collection.
   */
  public owner: string;

  /**
   * The description of the collection.
   */
  public description: string;

  /**
   * The list of Models the collection has.
   */
  public models: Model[];

  /**
   * The list of Worlds the collection has.
   */
  public worlds: World[];

  /**
   * The collection thumbnails.
   */
  public thumbnails: Image[] = [];

  /**
   * Whether the collection is private or not.
   */
  public private: boolean;

  /**
   * The date the resource has been modified.
   */
  public modifyDate: Date;

  /**
   * @param json A JSON that contains the required fields of the collection.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.owner = json['owner'];
    this.description = json['description'];
    this.private = json['private'];

    // Append the given thumbnails.
    if (json['thumbnails']) {
      const thumbnails: string[] = json['thumbnails'];
      thumbnails.forEach((url) => {
        const image = new Image();
        image.url = `${environment.API_HOST}/${environment.API_VERSION}${url}`;
        this.thumbnails.push(image);
      });
    }

    this.modifyDate = json['UpdatedAt'];
  }

  /**
   * Checks that the collection has a thumbnail image.
   *
   * @returns A boolean indicating whether the collection has a thumbnail or not.
   */
  public hasThumbnail(): boolean {
    return this.thumbnails && this.thumbnails.length !== 0;
  }

  /**
   * Get the collection's thumbnail to display.
   *
   * @returns The thumbnail image.
   */
  public getThumbnail(): Image {
    return this.thumbnails[0];
  }
}
