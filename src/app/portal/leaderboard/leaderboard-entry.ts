/**
 * A class that represents an entry in the Leader Board.
 */
export class LeaderBoardEntry {

  /**
   * The name of the competition.
   */
  public competition: string;

  /**
   * Name of the participant organization.
   */
  public participant: string;

  /**
   * The score of the entry.
   */
  public score: number | '-';

  /**
   * @param json A JSON that contains the required fields of an entry.
   */
  constructor(json: any) {
    this.competition = json['competition'];
    this.participant = json['owner'];
    this.score = json['score'];
    if (this.score === undefined) {
      this.score = '-';
    }
  }
}
