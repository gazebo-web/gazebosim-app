/**
 * A class that represents a Pull Request/Review.
 */
export class PullRequest {

  /**
   * id of pull request
   */
  id: string;

  /**
   * name of organization
   */
  owner: string;

  /**
   * creator
   */
  creator: string;

  /**
   * list of selected reviewers
   */
  reviewers: string[];

  /**
   * list of reviewers that approved
   */
  approvals: string[];

  /**
   * description of the pull request
   */
  description: string;

  /**
   * branch name
   */
  branch: string;

  /**
   * status of the pull request
   */
  status: string;

  /**
   * title
   */
  title: string;
}