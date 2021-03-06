import { FuelResource } from '../fuel-resource';

/**
 * A class that represents a World.
 *
 * Common methods are implemented in the FuelResource class.
 */
export class World extends FuelResource {

  /**
   * The extensions allowed by World files.
   */
  public static allowedExtensions: string[] = [
    'erb',
    'png',
    'sdf',
    /* tsv, dot, and dat files are used by SubT */
    'tsv',
    'dot',
    'dat',
    ];

  /**
   * The resource type used to build URLs.
   */
  public type: string = 'worlds';
}
