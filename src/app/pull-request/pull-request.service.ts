import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { PullRequest } from './pull-request';
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

  // create a new model and mark it for review
  public createNewModel(): Observable<PullRequest> {
    // path - createNewModelReviweUrl
    return of(this.buildPullRequest());
  }

  // get a specific review for a model
  public getReview(): Observable<PullRequest> {
    // path - getModelReviewUrl
    return of(this.buildPullRequest());
  }

  // update fields of a review like it's state, description, reviewers, etc
  public updateReview(): Observable<PullRequest> {
    // path updateReveiwUrl
    return of(this.buildPullRequest());
  }

  // create a new rev iew comment
  public createComment(): Observable<ReviewComment> {
    // path - newReviewCommentUrl
    return of(this.buildComment());
  }

  // temp function to return a pull request object
  private buildPullRequest(): PullRequest {
    const pullRequest = new PullRequest();
    pullRequest.id = '1';
    pullRequest.owner = 'organization';
    pullRequest.creator = 'boringsquare';
    pullRequest.reviewers = ['reviewer'];
    pullRequest.approvals = [];
    pullRequest.description = 'this is a temporary review object until the apis are ready. It will then be replaced';
    pullRequest.branch = 'new/model';
    pullRequest.status = 'status';
    pullRequest.title = 'Create new model';
    return pullRequest;
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

  private getModelReviewUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}`;
  }

  private getModelReviewsUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews`;
  }

  private createNewModelReviweUrl(): string {
    return `${this.baseUrl}/models/reviews`;
  }

  private updateModelReviewUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews`;
  }

  private updateModelUrl(username: string, model: string): string {
    return `${this.baseUrl}/${username}/models/${model}`;
  }

  private updateReviewUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}`;
  }

  private reviewMergeUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/merge`;
  }

  private newReviewCommentUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/comments`;
  }

  private updateReviewCommentUrl(username: string, model: string, id: string): string {
    return `${this.baseUrl}/${username}/models/${model}/reviews/${id}/comments`;
  }
}
