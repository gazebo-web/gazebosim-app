import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Review, PullRequest } from './pull-request';
import { ReviewComment } from './review-comment';

@Injectable()

export class PullRequestService {

  /**
   * @param factory Json factory
   * @param http Performs HTTP requests.
   */
  constructor(
    protected http: HttpClient
  ) {
  }

  /**
   * Base server URL, including version.
   */
  public baseUrl: string = `${environment.API_HOST}/${environment.API_VERSION}`;

  // create a new rev iew comment
  public createComment(): Observable<ReviewComment> {
    // path - newReviewCommentUrl
    return of(this.buildComment());
  }

  // create a new model and mark it for review
  public createNewModel(): Observable<Review> {
    // path - createNewModelReviweUrl
    return of(this.buildPullRequest());
  }

  // get a specific review for a model
  public getReview(): Observable<Review> {
    // path - getModelReviewUrl
    return of(this.buildPullRequest());
  }

  // update fields of a review like it's state, description, reviewers, etc
  public updateReview(): Observable<Review> {
    // path updateReveiwUrl
    return of(this.buildPullRequest());
  }

  // update comment
  public updateComment(): Observable<ReviewComment> {
    // path - updateReviewCommentUrl
    const comment = this.buildComment();
    comment.resolved = true;
    return of(comment);
  }

  // temp function to return a pull request object
  private buildPullRequest(): Review {
    const review = new Review();
    const pullRequest = new PullRequest();
    pullRequest.createdAt = '2021-04-22T01:16:15Z';
    pullRequest.updatedAt = '2021-04-22T01:16:15Z';
    pullRequest.owner = 'organization';
    pullRequest.creator = 'boringsquare';
    pullRequest.reviewers = ['reviewer'];
    pullRequest.approvals = [];
    pullRequest.description = 'this is a temporary review object until the apis are ready. It will then be replaced';
    pullRequest.branch = 'new/model';
    pullRequest.status = 'status';
    pullRequest.title = 'Create new model';
    pullRequest.private = false;

    review.modelId = '1';
    review.pullRequest = pullRequest;
    return review;
  }

  // temp function to build a comment
  private buildComment(): ReviewComment {
    const comment = new ReviewComment();
    comment.id = '1';
    comment.reviewId = '1';
    comment.reviewCommentId = '1';
    comment.user = 'boringsquare';
    comment.file = 'model.config';
    comment.version = '1';
    comment.lineStart = '2';
    comment.lineEnd = '4';
    comment.text = 'This is not right, do this instead';
    comment.resolved = false;
    return comment;
  }

  /**
   * returns the url to get a specific review for a model
   * @param username name of user who created the review
   * @param model model associated with the review
   * @param id id of review
   */
  private getModelReviewUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}`;
  }

  /**
   * returns the url to get reviews for a model the user has access to
   * @param username name of user who created the review
   * @param model model associated with the review
   */
  private getModelReviewsUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews`;
  }

  /**
   * returns the url to create a model and mark it for review
   */
  private createNewModelReviweUrl(): string {
    return `${this.baseUrl}/models/reviews`;
  }

  /**
   * returns the url to update and review an exsting model
   * @param username name of user who created the review
   * @param model model associated with the review
   */
  private updateModelReviewUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews`;
  }

  /**
   * returns the url to update an existing model
   * @param username name of user who created the review
   * @param model model associated with the review
   */
  private updateModelUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}`;
  }

  /**
   * returns the url to update an exsiting review
   * @param username name of user who created the review
   * @param model model associated with the review
   * @param id id of review
   */
  private updateReviewUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}`;
  }

  /**
   * returns the url to merge changes
   * @param username name of user who created the review
   * @param model model associated with the review
   * @param id id of review
   */
  private reviewMergeUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/merge`;
  }

  /**
   * returns the url to create a new review comment
   * @param username name of user who created the review
   * @param model model associated with the review
   * @param id id of review
   */
  private newReviewCommentUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/comments`;
  }

  /**
   * returns the url to update an edited review
   * @param username name of user who created the review
   * @param model model associated with the review
   * @param id id of review
   */
  private updateReviewCommentUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/comments`;
  }
}
