import { Simulation } from './simulation';

/**
 * A class that represents a Paginated List of Simulations.
 */
export class PaginatedSimulation {

  /**
   * The total number of simulations.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more simulations.
   */
  public nextPage: string = null;

  /**
   * An array of simulations the current page has.
   */
  public simulations: Simulation[] = [];

  /**
   * Whether there is or not a next page of simulations.
   *
   * @returns A boolean indicating the existence of a next page of simulations.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
