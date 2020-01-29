import { FuelResource } from './fuel-resource';

/**
 * Represents a paginated fuel resource.
 * When requesting resources to the server, the response comes paginated by default.
 * This class intends to reflect that response, containing not only those paginated resources,
 * but some additional information, such as the total amount of resources and the URL of
 * the next page in order to load more.
 */
export abstract class FuelPaginatedResource {

  /**
   * The total number of resources.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more resources.
   */
  public nextPage: string = null;

  /**
   * An array of individual resources representing the current page.
   */
  public abstract resources: FuelResource[];

  /**
   * Whether there is or not a next page of resources.
   *
   * @returns A boolean indicating the existence of a next page.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
