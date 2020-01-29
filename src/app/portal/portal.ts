import { Image } from '../model/image';
import { Organization } from '../organization';

/**
 * A class that represents a Portal.
 * TODO(german-mas): This class needs to be completed once portals are available in the Server.
 * See https://app.asana.com/0/851925973517080/909537141592497/f
 */
export class Portal {

  /**
   * The name of the portal.
   */
  public name: string;

  /**
   * The owner of the portal.
   */
  public owner: string;

  /**
   * The description of the portal.
   */
  public description: string;

  /**
   * The URL of the portal.
   */
  public url: string;

  /**
   * Whether the portal is private or not.
   */
  public private: boolean;

  /**
   * The list of organizations that are participating.
   */
  public participants: Organization[] = [];

  /**
   * The portal thumbnails.
   */
  public thumbnails: Image[] = [];

  /**
   * @param json A JSON that contains the required fields of the portal.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.owner = json['owner'];
    this.description = json['description'];
    this.url = json['url'];
    this.private = json['private'];

    // TODO(german-mas): Placeholder. Append the correct thumbnails once they are ready.
    // See https://app.asana.com/0/851925973517080/909537141592497/f
    const image = new Image();
    image.url = 'assets/images/subt-hero.png';
    this.thumbnails.push(image);
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
