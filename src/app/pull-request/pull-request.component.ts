import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
   * list of reviwers
   */
  public reviewers: string[] = ['John', 'steven', 'mary', 'jane', 'extra guy', 'boaringsquare'];

  public fakeFiles = this.generateFakeFiles();
  public user = '';
  public prId = '';
  public modelName = '';
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
  public isReviewer: boolean;
  public isApproved: boolean;

  /**
   *  @param activatedRoute The current Activated Route to get associated the data
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public pullRequestService: PullRequestService,
  ) { }

  ngOnInit(): void {
    this.prId = this.activatedRoute.snapshot.paramMap.get('id');
    this.user = this.activatedRoute.snapshot.paramMap.get('user');
    this.modelName = this.activatedRoute.snapshot.paramMap.get('name');
    // this.isReviewer = this.checkIsReviewer(this.user, this.selectedReviewers);
    // if (this.isReviewer) {
    //   this.isApproved = this.checkIsApproved(this.user, this.review.approvals);
    // }
  }

  public checkIsReviewer(user: string, reviewer: string): boolean {
    return this.selectedReviewers.includes(user) && user === reviewer;
  }

  public checkIsApproved(user: string, approvals: string[]): boolean {
    return approvals.includes(user);
  }
  public deleteReviewer(reviewer): void {
    this.selectedReviewers = this.selectedReviewers.filter(val => val !== reviewer);
  }
  public getReview(): void {
    // TODO - implement get review method
  }
  public onApprove(reviewer: string): void {
    this.review.approvals = [...this.review.approvals, reviewer];
  }

  private generateFakeFiles(): File[] {
    const file1 = new File([], 'file.png', {type: 'image/png'});
    const file2 = new File([], 'file.config', {type: ''});
    const file3 = new File([], 'file.sdf', {type: ''});
    return [file1, file2, file3];
  }

  private getModel(): void {
    // TODO - implement get model method
  }
}
