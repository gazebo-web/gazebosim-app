import {
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
} from 'three';
import { Topic } from './topic';

/**
 * A class that represents the topic of a Point Cloud.
 *
 * Uses the Topic interface and provides custom logic to deal with point clouds.
 */
export class PointCloudTopic implements Topic {

  /**
   * Topic name.
   */
  public name: string;

  /**
   * The mesh of points of the sensor.
   * Type THREE.Points.
   */
  private points: any;

  /**
   * The geometry of the points.
   * Type THREE.BufferGeometry.
   */
  private geometry: any;

  /**
   * The material to use in the points.
   * Type THREE.PointsMaterial.
   */
  private material: any;

  /**
   * Lidar object.
   */
  private lidar: any;

  /**
   * Scene reference. Contains the object that will hold these points.
   */
  private scene: any;

  /**
   * PointCloudTopic Constructor.
   * Contains initialization logic for this particular topic.
   *
   * @param topicName The name of the topic, used to identify it.
   * @param scene Reference to the scene. Used to match this point cloud to a particular sensor.
   */
  constructor(topicName: string, scene: object) {
    this.name = topicName;

    this.geometry = new BufferGeometry();
    this.material = new PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      color: 0x0000ff,
    });

    this.points = new Points(this.geometry, this.material);

    this.scene = scene;
  }

  /**
   * Topic callback.
   */
  public cb(msg: any): void {
    // Get the sensor frame and construct the lidar object.
    if (!this.lidar) {
      msg.header.data.forEach((data) => {
        if (data.key === 'frame_id') {
          this.lidar = this.scene.getByProperty('scopedName', data.value[0]);

          // Add the points to the lidar if found.
          if (this.lidar) {
            this.lidar.add(this.points);
          }
        }
      });
    }

    // Construct the data view into the point buffer.
    const view = new DataView(
      msg.data.buffer,
      msg.data.byteOffset,
      msg.data.byteLength
    );

    // Compute the total number of points, assuming each point has an X, Y, and Z component.
    const vertices = new Float32Array(msg.height * msg.width * 3);

    for (let j = 0; j < msg.height; ++j) {
      for (let i = 0; i < msg.width; ++i) {
        let index = j * msg.row_step + i * msg.point_step;
        const x = view.getFloat32(index, !msg.is_bigendian);
        const y = view.getFloat32(index + 4, !msg.is_bigendian);
        const z = view.getFloat32(index + 8, !msg.is_bigendian);

        index = j * msg.width * 3 + i * 3;
        vertices[index] = isFinite(x) ? x : 0;
        vertices[index + 1] = isFinite(y) ? y : 0;
        vertices[index + 2] = isFinite(z) ? z : 0;
      }
    }

    this.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
  }

  /**
   * Handle unsubscription. Removes the points from the scene.
   */
  public unsubscribe(): void {
    if (this.lidar) {
      const points = [];
      // Removal of elements during traverse is discouraged.
      this.lidar.traverse((child) => {
        if (child instanceof Points) {
          points.push(child);
        }
      });
      points.forEach((obj) => this.lidar.remove(obj));
    }
  }
}
