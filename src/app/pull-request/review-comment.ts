export class ReviewComment {
  /**
   * id of comment
   */
  id: string;

  /**
   * id of review
   */
  reviewId: string;

  /**
   * TBD
   */
  reviewCommentId: string;

  /**
   * user who wrote the comment
   */
  user: string;

  /**
   * file related to the comment
   */
  file: string;

  /**
   * TBD
   */
  version: string;

  /**
   * start line of the file
   */
  lineStart: string;

  /**
   * end line of the file
   */
  lineEnd: string;

  /**
   * content of the comment
   */
  text: string;

  /**
   * whether the issue has been resolved or not
   */
  resolved: boolean;
}
