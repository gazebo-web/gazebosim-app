/**
 * A class that represents a Logfile.
 */
export class Logfile {

  /**
   * The name of the file.
   */
  public name: string;

  /**
   * Location of the file in AWS.
   * It is the full path of the file.
   */
  public location: string;

  /**
   * The status of the file.
   * Note:
   * 0 -> Revision pending.
   * 1 -> Approved by an admin.
   * 2 -> Rejected by an admin.
   */
  public status: number;

  /**
   * Score of the log file.
   * Note:
   * A logfile can be scored only if it's approved (status = 1).
   */
  public score: number;

  /**
   * Creator of the logfile. The user that uploaded the file.
   */
  public creator: string;

  /**
   * Owner of the logfile.
   */
  public owner: string;

  /**
   * ID of the logfile.
   */
  public id: number;

  /**
   * Competition this logfile was submitted to.
   */
  public competition: string;

  /**
   * The date the logfile has been uploaded for the first time.
   */
  public uploadDate: Date;

  /**
   * The date the logfile has been modified.
   */
  public modifyDate: Date;

  /**
   * The date the logfile has been approved.
   */
  public resolvedDate: Date;

  /**
   * Whether the logfile is private or not.
   */
  public private: boolean;

  /**
   * @param json A JSON that contains the required fields of the logfile.
   */
  constructor(json: any) {

    this.competition = json['competition'];
    this.uploadDate = json['created_at'];
    this.creator = json['creator'];
    this.id = json['id'];
    this.location = json['location'];
    this.owner = json['owner'];
    this.private = json['private'];
    this.resolvedDate = json['resolved_at'];
    this.modifyDate = json['updated_at'];
    this.status = json['status'];
    this.score = json['score'];

    // Name is equal to the last part of the path.
    this.name = /[^/]*$/.exec(this.location)[0];
  }

  /**
   * Get the status of the logfile as a string.
   *
   * @returns The status as a string.
   */

  public getStatus(): string {
    switch (this.status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Pending';
    }
  }
}
