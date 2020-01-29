import { Machine } from '.';

/**
 * A class that represents a Paginated List of Machines.
 */
export class PaginatedMachine {

  /**
   * The total number of machines.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more machines.
   */
  public nextPage: string = null;

  /**
   * An array of machines the current page has.
   */
  public machines: Machine[] = [];

  /**
   * Whether there is or not a next page of machines.
   *
   * @returns A boolean indicating the existence of a next page of simulations.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
