import { Model } from './model';
import { FuelPaginatedResource } from '../fuel-resource';

/**
 * Represents a paginated list of models.
 */
export class PaginatedModels extends FuelPaginatedResource {

  /**
   * An array of models representing the current page.
   */
  public resources: Model[];
}
