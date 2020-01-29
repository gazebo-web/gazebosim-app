import { Injectable } from '@angular/core';

@Injectable()

/**
 * Factory service that returns instances of a given class, using a Json object.
 *
 * This will allow us to return one or many instances of different classes.
 */
export class JsonClassFactoryService {

  /**
   * Given a JSON, returns a new instance or an array of instances of the given class.
   *
   * @param json A json that contains the object or objects to instantiate.
   * @param className The class of the new objects.
   * @returns An instance or array of instances of the given class.
   */
  public fromJson(json: any, className: any): any | any[] {
    if (Array.isArray(json)) {
      return this.fromJsonArray(json, className);
    } else {
      return this.fromJsonRecord(json, className);
    }
  }

  /**
   * Returns a single instance of the given class.
   *
   * @param json A json that contains the object.
   * @param className The class of the new object.
   * @returns An instance of the given class.
   */
  private fromJsonRecord(json: any, className: any): any {
    return new className(json);
  }

  /**
   * Returns an array of instances of the given class.
   *
   * @param json A json that contains the array of object.
   * @param className The class of the new objects.
   * @returns An array of instances of the given class.
   */
  private fromJsonArray(json: any, className: any): any[] {
    const classArray = [];
    for (const single of json) {
      const instance = new className(single);
      classArray.push(instance);
    }
    return classArray;
  }
}
