import { FuelResource } from '../fuel-resource';

/**
 * A class that represents a Pull request.
 *
 * Common methods are implemented in the FuelResource class.
 */
export class PullRequest extends FuelResource {

  /**
   * The extensions allowed by Model files.
   */
  public static allowedExtensions: string[] = [
    'bvh',
    'config',
    'dae',
    'dds',
    'jpg',
    'material',
    'mtl',
    'obj',
    'png',
    'pbtxt',
    'sdf',
    'sdf.erb',
    'stl',
    'tga',
    ];
}