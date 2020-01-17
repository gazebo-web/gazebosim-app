/**
 * A class that represents a machine instance.
 */
export class Machine {

  /**
   * Static array that contains the available status.
   */
  public static readonly StatusList = [
    'Initializing',
    'Running',
    'Terminating',
    'Terminated',
    'Error',
  ];

  /**
   * Id of the machine instance.
   */
  public instanceId: string;

  /**
   * Ip address of the machine instance.
   */
  public privateIp: string;

  /**
   * Most recent machine status.
   */
  public status: string;

  /**
   * Group this machine belongs to.
   */
  public groupId: string;

  /**
   * When this machine was created.
   */
  public createdAt: Date;

  /**
   * Constructor
   */
  constructor(json: any) {
    this.createdAt = json['created_at'];
    this.instanceId = json['instance_id'];
    this.privateIp = json['private_ip'];
    this.status = json['status'];
    this.groupId = json['group_id'];
  }
}
