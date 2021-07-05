import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';

import { Organization } from '../../organization/organization';
import { OrganizationService } from '../../organization/organization.service';
import { PullRequestService } from '../../pull-request/pull-request.service';

@Component({
  selector: 'ign-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss']
})
export class ReviewComponent implements OnInit {

  /**
   * owner of the model
   */
  public owner = '';

  /**
   * fake branch name, need to remove later
   */
  public fakeBranch = 'base:main';

  /**
   * Name of the model, to be retrived from url
   *
   */
  public modelName = '';

  /**
   * Comments that user wrote before opening the pr
   */
  public description = '';

  /**
   * list of reviwers
   */
  public reviewers: string[] = [];

  /**
   * reviewer the user selected
   */
  public selectedReviewers = [];

  /**
   * today's date. To be displayed in the file display section
   */
  public date = this.getDate();

  /**
   * list of fake files for testing. Will be replaced with real files uploaded by user
   */
  public files: File[];

  /**
   * Id of review
   */
  public prId: string;

  /**
   * organization
   */
  private organization: Organization;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param router Router to navigate to other URLs
   * @param snackBar Snackbar to display notifications
   * @param pullRequestService PullRequestService
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public router: Router,
    public snackBar: MatSnackBar,
    public organizationService: OrganizationService,
    public pullRequestService: PullRequestService,
  ) { }

  ngOnInit(): void {
    this.modelName = this.activatedRoute.snapshot.paramMap.get('modelname');
    this.owner = this.activatedRoute.snapshot.paramMap.get('owner');
    this.prId = this.activatedRoute.snapshot.paramMap.get('id');
    this.getReviewers(this.owner);
  }

  /**
   * function to create pull request
   */
  public createPullRequest(): void {
    /**
     * TODO: endpoint to store review
     */
    if (this.description.length === 0) {
      this.snackBar.open('Description cannot be empty.', 'Got it');
    } else if (this.selectedReviewers.length === 0) {
      this.snackBar.open('Please select a reviewer.', 'Got it');
    } else {
      // update description and reviewers of existing pr
      this.pullRequestService.updateReview().subscribe(res => {
        this.router.navigate([
          `/${res.pullRequest.owner}/pr/model/${this.modelName}/${res.modelId}`
        ]);
      });
    }
  }

  /**
   * delete a selected reviewer
   */
  public deleteReviewer(reviewer): void {
    this.selectedReviewers = this.selectedReviewers.filter(val => val !== reviewer);
  }

  /**
   * Modify the Description based on the event received.
   *
   * @param description The modified description.
   */
  public onModifyDescription(description: string): void {
    this.description = description;
  }

  /**
   * Get today's date in dd - month - year format
   */
  private getDate(): string {
    const monthStore = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const dd = today.getDate().toString();
    const month = monthStore[today.getMonth()];
    const year = today.getFullYear().toString();
    return dd + ' ' + month + ' ' + year;
  }

  /**
   * Get reviewers
   */
  private getReviewers(name: string): void {
    this.organizationService.getOrganization(name).subscribe(response => {
      this.organization = response;
      this.organizationService.getOrganizationUsers(this.organization).subscribe(res => {
        const holder = res.map(user => {
          return user.username;
        });
        this.reviewers = holder;
      });
    });
  }
 }
