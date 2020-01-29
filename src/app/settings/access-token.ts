/**
 * A class that represents an AccessToken.
 */
export class AccessToken {

    /**
     * Name of the token.
     */
    public name: string;

    /**
     * When the token was created.
     */
    public created: Date;

    /**
     * Token prefix.
     */
    public prefix: string;

    /**
     * Token key.
     */
    public key: string;

    /**
     * Last used time.
     */
    public lastUsed: Date;

    /**
     * @param json A JSON that contains the fields of an access token.
     */
    constructor(json: any) {
      this.name = json['name'];
      this.prefix = json['prefix'];
      this.key = json['key'];
      this.created = json['created_at'];
      this.lastUsed = json['last_used'];
    }
  }
