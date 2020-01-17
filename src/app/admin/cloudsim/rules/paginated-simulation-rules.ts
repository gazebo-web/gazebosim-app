import { SimulationRule } from './simulation-rule';

/**
 * A class that represents a Paginated List of Simulation Rules.
 */
export class PaginatedSimulationRules {

  /**
   * The total number of rules.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more rules.
   */
  public nextPage: string = null;

  /**
   * An array of rules the current page has.
   */
  public rules: SimulationRule[] = [];

  /**
   * Whether there is or not a next page of simulation rules.
   *
   * @returns A boolean indicating the existence of a next page of simulation rules.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
