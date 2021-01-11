import { FuelResource } from '../fuel-resource';

/**
 * A class that represents a Model.
 *
 * Common methods are implemented in the FuelResource class.
 */
export class Model extends FuelResource {

  /**
   * The extensions allowed by Model files.
   */
  public static allowedExtensions: string[] = [
    'bvh',
    'config',
    'dae',
    'dds',
    'glsl',
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

  /**
   * The resource type used to build URLs.
   */
  public type: string = 'models';
}
