/**
 * A class that represents an Organization.
 */
export class Organization {

  /**
   * The roles an organization can have.
   */
  public static roles: string[] = [
    'Member',
    'Admin',
    'Owner'
    ];

  /**
   * Name of the Organization.
   */
  public name: string;

  /**
   * Description of the Organization.
   */
  public description: string;

  /**
   * @param json A JSON that contains the required fields of the organization.
   */
  constructor(json: any) {
    this.name = json['name'];
    this.description = json['description'];
  }
}
