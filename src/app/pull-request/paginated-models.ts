import { PullRequest } from './pull-request';
import { FuelPaginatedResource } from '../fuel-resource';

/**
 * Represents a paginated list of Pull requests.
 */
export class PaginatedModels extends FuelPaginatedResource {

  /**
   * An array of Pull requests representing the current page.
   */
  public resources: PullRequest[];
}
