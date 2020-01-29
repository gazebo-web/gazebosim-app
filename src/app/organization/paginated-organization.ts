import { Organization } from './organization';

/**
 * A class that represents a paginated list of organizations.
 */
export class PaginatedOrganizations {

  /**
   * The total number of organizations.
   */
  public totalCount: number = 0;

  /**
   * An array of Organizations.
   */
  public organizations: Organization[];
}
