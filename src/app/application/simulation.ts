import { environment } from '../../environments/environment';


/**
 * A class that represents a Simulation instance.
 */
export class Simulation {

  /**
   * The name given to the simulation.
   */
  public name: string;

  /**
   * The entity who started the simulation.
   */
  public creator: string;

  /**
   * The entity who owns the simulation.
   */
  public owner: string;

  /**
   * The date and time when the simulation started.
   */
  public created_at: Date;

  /**
   * The status of the simulation. Whether it is running, active, paused or stopped.
   */
  public status: string;

  /**
   * Id of the Kubernetes pods and services.
   */
  public groupid: string;

  /**
   * Docker Image of the Simulation.
   */
  public image: string;

  /**
   * URI of the instance.
   */
  public uri: string;

  /**
   * @param json A JSON that contains the required fields of the resource.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.owner = json['owner'];
    this.creator = json['creator'];
    this.groupid = json['groupid'];
    this.created_at = json['created_at'];
    this.status = json['status'];
    this.image = json['image'];
    this.uri = json['uri'];
  }
}
