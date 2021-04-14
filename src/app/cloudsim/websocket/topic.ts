/**
 * Type that represents a topic to be subscribed. This allows communication between Components and
 * the Websocket service of a Simulation.
 */
export interface Topic {
  /**
   * The name of the topic, used to identify it.
   */
  name: string;

  /**
   * Callback to use for this current topic.
   */
  cb(msg: any): any;

  /**
   * Optional. Function to be called when unsubscribing from the topic.
   */
   unsubscribe?(): any;
}
