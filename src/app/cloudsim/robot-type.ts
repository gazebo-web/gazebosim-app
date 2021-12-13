/**
 * Interface describing a Robot type. It contains extra information for each robot.
 */
export interface RobotType {
  /**
   * SubT Credit cost of the robot.
   */
  credits?: number;

  /**
   * A human readable Robot Type name. Use this instead of 'type' for display purposes.
   */
  name?: string;

  /**
   * The owner of the Fuel robot.
   */
  owner?: string;

  /**
   * A thumbnail of the robot.
   */
  thumbnail?: string;

  /**
   * The robot type. This is usually equal to the name.
   */
  type?: string;
}
