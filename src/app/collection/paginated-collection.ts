import { Collection } from './collection';

/**
 * A class that represents a paginated list of collections.
 * This resource comes paginated
 */
export class PaginatedCollection {

  /**
   * The total number of collections.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more collections.
   */
  public nextPage: string = null;

  /**
   * An array of Collections the current page has.
   */
  public collections: Collection[] = [];

  /**
   * Whether there is or not a next page of collections.
   *
   * @returns A boolean indicating the existence of a next page of collections.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
