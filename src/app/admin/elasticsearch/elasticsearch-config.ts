/**
 * Represents an Elasticsearch configuration
 */
export class ElasticsearchConfig {

  /**
   * ID of the search config in the database.
   */
  public id: number = 0;

  /**
   * URI address of the elastic search server.
   */
  public address: string = null;

  /**
   * Username used to access the elastic search server.
   */
  public username: string = null;

  /**
   * Password used to access the elastic search server.
   */
  public password: string = null;

  /**
   * True if this is the primary elastic search server.
   */
  public primary: boolean = false;

  /**
   * @param json A JSON that contains the required fields of the collection.
   */
  constructor(json: any) {
    this.id = json['id'];
    this.address = json['address'];
    this.username = json['username'];
    this.password = json['password'];
    this.primary = json['primary'];
  }
}
