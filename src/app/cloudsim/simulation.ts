/**
 * Enum of available simulation status.
 * They come from the Cloudsim Server.
 *
 * Note: The Status RunningWithErrors with ID = 40 was deprecated.
 */
enum Status {
  Pending = 0,
  LaunchingNodes = 10,
  LaunchingPods = 20,
  Launching = 25, // Corresponds to simParentLaunching in the Server.
  RunningWithErrors = 28, // Corresponds to simParentLaunchingWithErrors in the Server.
  Running = 30,
  TerminateRequested = 50,
  DeletingPods = 60,
  DeletingNodes = 70,
  TerminatingInstances = 80,
  Terminated = 90,
  Rejected = 100
}

/**
 * A class that represents a Simulation instance.
 */
export class Simulation {

  /**
   * Use the Status enum as a static property of the Simulation class.
   * Done this way because Typescript doesn't allow declaring enums inside classes.
   */
  public static readonly Status = Status;

  /**
   * URL of the S3 Bucket that contains all the simulation logs.
   */
  public static readonly bucketUrl: string =
    `https://s3.console.aws.amazon.com/s3/buckets/${AWS_GZ_LOGS_BUCKET}/gz-logs/`;

  /**
   * Static array that contains each Status in the enumeration as a string.
   */
  public static readonly StatusList = Object.keys(Status)
    .map(
      (key) => {
        return Status[key as string];
      })
    .filter(
      (key) => {
        return !Number.isInteger(key);
      }
    );

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
  public startedAt: Date;

  /**
   * The duration of the simulation.
   */
  public runTime: Date;

  /**
   * The application being simulated.
   */
  public application: string;

  /**
   * The status of the simulation. Whether it is running, active, paused or stopped.
   */
  public status: string;

  /**
   * Id of the Kubernetes pods and services.
   */
  public groupId: string;

  /**
   * Docker Image of the Simulation.
   */
  public image: string;

  /**
   * Error Status. Provides insight if an error happened in the simulation instance.
   */
  public errorStatus: string;

  /**
   * Holds the role of the Simulation if it's made of multiple ones (e.g. Tunnel Circuit).
   */
  public multiSim: number;

  /**
   * Holds the metadata from simulation
   */
  public extra: object;

  /**
   * @param json A JSON that contains the required fields of the resource.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.owner = json['owner'];
    this.creator = json['creator'];
    this.groupId = json['group_id'];
    this.startedAt = json['created_at'];
    this.runTime = json['run_time'];
    this.application = json['application'];
    this.status = Simulation.Status[json['status']];
    this.image = json['image'];
    this.errorStatus = json['error_status'];
    this.multiSim = json['MultiSim'];
    this.extra = JSON.parse(json['extra']);
  }

  /**
   * Return whether a simulation is considered to be in process of launching or not.
   */
  public isLaunching(): boolean {
    let launching = false;

    if (this.status === 'Pending' ||
        this.status === 'LaunchingNodes' ||
        this.status === 'LaunchingPods') {
      launching = true;
    }
    return launching;
  }

  /**
   * Return whether the simulation can be restarted or not.
   *
   * Only single simulations or child simulations that aren't running and have an error status
   * can be restarted.
   */
  public canBeRestarted(): boolean {
    const notRunning = Simulation.Status[this.status] >= Simulation.Status['TerminateRequested'];

    return notRunning && (this.multiSim === 0 || this.multiSim === 2) && this.errorStatus !== '';
  }
}
