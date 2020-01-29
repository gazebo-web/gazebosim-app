import { LeaderBoardEntry } from './leaderboard-entry';

/**
 * A class that represents a Paginated List of Leader Board Entries.
 */
export class PaginatedLeaderBoardEntry {

  /**
   * The total number of entries.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more entries.
   */
  public nextPage: string = null;

  /**
   * An array of entries the current page has.
   */
  public entries: LeaderBoardEntry[] = [];

  /**
   * Whether there is or not a next page of entries.
   *
   * @returns A boolean indicating the existence of a next page of entries.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
