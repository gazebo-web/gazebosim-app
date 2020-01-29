/**
 * A class that represents a User.
 */
export class User {

  /**
   * Username. Chosen name within Fuel.
   */
  public username: string;

  /**
   * Name. The name of the user. Extracted from the token profile.
   */
  public name: string;

  /**
   * Email. The email of the user. Extracted from the token profile.
   */
  public email: string;

  /**
   * Array of Organization names the user belongs to.
   */
  public organizations: string[];

  /**
   * Permissions of the user to the organizations they belong to.
   */
  public orgRoles: any;

  /**
   * True if the user is a system administrator
   */
  public sysAdmin: boolean = false;

  /**
   * @param json A JSON that contains the required fields of the organization.
   */
  constructor(json: any) {
    this.username = json['username'];
    this.name = json['name'];
    this.email = json['email'];
    this.organizations = json['orgs'];
    this.orgRoles = json['orgRoles'];
    this.sysAdmin = json['sysAdmin'];
  }
}
