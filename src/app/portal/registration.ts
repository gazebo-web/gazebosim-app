/**
 * A class that represents a Registration.
 * A registration is a request made by users to join a competition.
 */
export class Registration {

  /**
   * Name of the competition the registration is for.
   */
  public competition: string;

  /**
   * Username that created the registration.
   */
  public creator: string;

  /**
   * The name of the participant organization.
   */
  public participant: string;

  /**
   * Date of creation.
   */
  public createdAt: Date;

  /**
   * Date when the status of this registration was modified.
   */
  public resolvedAt: Date;

  /**
   * Status of the registration request. Whether it is accepted (done), pending or rejected.
   * Note:
   * 0 -> Pending
   * 1 -> Accepted
   * 2 -> Rejected
   */
  public status: 0 | 1 | 2;

  /**
   * @param json A JSON that contains the required fields of the registration.
   */
  constructor(json: any) {

    this.competition = json['competition'];
    this.creator = json['creator'];
    this.participant = json['participant'];
    this.createdAt = json['created_at'];
    this.resolvedAt = json['resolved_at'];
    this.status = json['status'];
  }

  /**
   * Get the status of the registration as a string.
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
