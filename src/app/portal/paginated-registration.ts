import { Registration } from '../portal';

/**
 * A class that represents a Paginated List of Registrations.
 * A registration is a request made by users to join a competition.
 */
export class PaginatedRegistration {

  /**
   * The total number of registrations.
   */
  public totalCount: number = 0;

  /**
   * The next page used to load more registrations.
   */
  public nextPage: string = null;

  /**
   * An array of Registrations the current page has.
   */
  public registrations: Registration[] = [];

  /**
   * Whether there is or not a next page of registrations.
   *
   * @returns A boolean indicating the existence of a next page of registrations.
   */
  public hasNextPage(): boolean {
    return this.nextPage !== null;
  }
}
