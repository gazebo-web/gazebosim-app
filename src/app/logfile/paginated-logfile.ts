import { Logfile } from './logfile';

/**
 * A class that represents a Paginated List of Logfiles.
 */
export class PaginatedLogfile {

  /**
   * The total number of logfiles.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more logfiles.
   */
  public nextPage: string = null;

  /**
   * An array of Logfiles the current page has.
   */
  public logfiles: Logfile[] = [];

  /**
   * Whether there is or not a next page of logfiles.
   *
   * @returns A boolean indicating the existence of a next page of logfiles.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
