import { World } from './world';
import { FuelPaginatedResource } from '../fuel-resource';

/**
 * Represents a paginated list of worlds.
 */
export class PaginatedWorlds extends FuelPaginatedResource {

  /**
   * An array of worlds representing the current page.
   */
  public resources: World[];
}
