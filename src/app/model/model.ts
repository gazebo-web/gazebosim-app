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
    'bin',
    'bvh',
    'config',
    'dae',
    'dds',
    'glb',
    'glsl',
    'gltf',
    'jpg',
    'material',
    'metal',
    'mtl',
    'obj',
    'png',
    'pbtxt',
    'sdf',
    'sdf.erb',
    'stl',
    'tga',
    'tif',
    ];

  /**
   * The resource type used to build URLs.
   */
  public type: string = 'models';
}
