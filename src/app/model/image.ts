/**
 * A class that represents an Image.
 */
export class Image {

  /**
   * URL of the image.
   */
  public url: string;

  /**
   * Returns an encoded version of the URL, encoding single quote characters as this is required
   * in the value of some CSS properties, such as background-image.
   *
   * @returns The encoded URL without single quote characters.
   */
  public getEncodedUrl(): string {
    return this.url.replace(new RegExp(`\'`, 'g'), '%27');
  }
}
