// TODO - remember to fill in the defined states of Prs
export enum PullRequestStatus {

}

/**
 * A class that represents review object
 */
export class Review {
  pullRequest: PullRequest;
  /**
   * id of review
   */
  modelId: string;
}

/**
 * A class that represents a Pull Request/Review.
 */
export class PullRequest {
  /**
   * date the pull request is created
   */
  public createdAt: string;

  /**
   * date the pull request is updated
   */
  public updatedAt: string;
  /**
   * name of organization
   */
  public owner: string;

  /**
   * creator
   */
  public creator: string;

  /**
   * list of selected reviewers
   */
  public reviewers: string[];

  /**
   * list of reviewers that approved
   */
  public approvals: string[];

  /**
   * description of the pull request
   */
  public description: string;

  /**
   * branch name
   */
  public branch: string;

  /**
   * status of the pull request
   */
  public status: string;

  /**
   * title
   */
  public title: string;

  /**
   * review is accessible to public or not
   */
  public private: boolean;
}
