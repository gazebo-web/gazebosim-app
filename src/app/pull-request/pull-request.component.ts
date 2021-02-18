import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { PullRequestService } from './pull-request.service';

@Component({
  selector: 'ign-pull-request',
  templateUrl: './pull-request.component.html',
  styleUrls: ['./pull-request.component.scss']
})
export class PullRequestComponent implements OnInit {

  /**
   * list of selected reviewers, if any
   */
  public selectedReviewers = ['steven', 'mary', 'boaringsquare'];

  /**
   * list of reviwers in an organization
   */
  public reviewers: string[] = ['John', 'steven', 'mary', 'jane', 'extra guy', 'boaringsquare'];

  /**
   * List of uploaded files
   */
  public files = [];

  /**
   * owner of model
   */
  public organization = '';

  /**
   * User currently logged in
   */
  public user = 'boaringsquare';

  /**
   * id of pull requests
   */
  public prId = '';

  /**
   * model name
   */
  public modelName = '';

  /**
   * temp review object
   */
  public review = {
    id: '1',
    owner: 'boaringsquare',
    creator: 'boringsquare',
    reviewers: this.selectedReviewers,
    date: '19 November 2020',
    approvals: [],
    description: 'this is a temporary review object until the apis are ready. It will then be replaced',
    branch: 'new/model',
    status: 'status',
    title: 'Create new model'
  };

  /**
   * boolean to indicate if a logged in user is a reviewer
   */
  public isReviewer: boolean;

  /**
   * check if user has approved the pull request
   */
  public isApproved: boolean;

  /**
   *  @param activatedRoute The current Activated Route to get associated the data
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public pullRequestService: PullRequestService,
  ) { }

  ngOnInit(): void {
    /**
     * get pull request id
     */
    this.prId = this.activatedRoute.snapshot.paramMap.get('id');

    /**
     * get the organization
     */
    this.organization = this.activatedRoute.snapshot.paramMap.get('organization');

    /**
     * get the model name
     */
    this.modelName = this.activatedRoute.snapshot.paramMap.get('name');

    /**
     * check if user is a reviewer and has approved the pull request or not
     */
    this.isReviewer = this.checkIsReviewer(this.user);
    if (this.isReviewer) {
      this.isApproved = this.checkIsApproved(this.user, this.review.approvals);
    }
  }

  /**
   *
   * @param user
   * the logged in user
   *
   * check if the user logged in is one of the selected reviewers
   */
  public checkIsReviewer(user: string): boolean {
    return this.selectedReviewers.includes(user);
  }

  /**
   *
   * @param user
   * logged in user
   * @param approvals
   * list of reviewers that have approved the pull requests
   *
   * check if the user is included in the list of reviewers who approved the review in review object
   * if not, show the green check mark icon for user to approve
   */
  public checkIsApproved(user: string, approvals: string[]): boolean {
    return approvals.includes(user);
  }

  /**
   *
   * @param reviewer
   * selected reviewer
   *
   * delete reviewer
   */
  public deleteReviewer(reviewer): void {
    this.selectedReviewers = this.selectedReviewers.filter(val => val !== reviewer);
  }

  /**
   *
   * @param reviewer
   * the reviewer
   *
   * add user to list of approved reviewers once he/she approves the pull requests
   */
  public onApprove(reviewer: string): void {
    this.review.approvals = [...this.review.approvals, reviewer];
  }
}
