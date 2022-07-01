import { Topic } from './topic';

/**
 * A class that represents the topic of an image
 *
 * Uses the Topic interface and provides custom logic to deal with images.
 */
export class ImageTopic implements Topic {

  /**
   * Topic name.
   */
  public name: string;

  /**
   * Image stream container.
   */
  private imageContainer: any;

  /**
   * Image HTML Element.
   */
  private imageElement: any;

  /**
   * Image ID
   */
  private imageId: any;

  /**
   * ImageTopic Constructor.
   * Contains initialization logic for this particular topic.
   *
   * @param topicName The name of the topic, used to identify it.
   * @param imageContainer reference to image container object
   */
  constructor(topicName: string, imageContainer: object) {
    this.name = topicName;

    this.imageContainer = imageContainer;

    // create new image element and append it to image streams container
    this.imageElement = window.document.createElement('img');
    this.imageId = this.name.replace(new RegExp('/', 'g'), '-');
    this.imageElement.id = this.imageId;
    this.imageElement.alt = this.name;
    this.imageElement.title = this.name;
    this.imageContainer.appendChild(this.imageElement);
  }

  /**
   * Topic callback.
   */
  public cb(msg: any): void {
    this.imageElement.src = 'data:image/png;base64,' + this.encode(msg);
  }

  public unsubscribe(): void {
    this.imageContainer.removeChild(this.imageElement);
    this.imageElement.remove();
  }

  // public method for encoding an Uint8Array to base64
  private encode(input: any): string {
   // taken from https://stackoverflow.com/a/6740027
   const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
   let output = '';
   let chr1;
   let chr2;
   let chr3;
   let enc1;
   let enc2;
   let enc3;
   let enc4;
   let i = 0;
   while (i < input.length) {
     chr1 = input[i++];
     chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index
     chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here
     /* eslint-disable no-bitwise */
     enc1 = chr1 >> 2;
     enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
     enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
     enc4 = chr3 & 63;
     /* eslint-enable no-bitwise */
     if (isNaN(chr2)) {
         enc3 = enc4 = 64;
     } else if (isNaN(chr3)) {
         enc4 = 64;
     }
     output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
               keyStr.charAt(enc3) + keyStr.charAt(enc4);
   }
   return output;
  }
}
