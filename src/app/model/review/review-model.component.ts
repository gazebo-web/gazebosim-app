import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FuelResource } from 'src/app/fuel-resource';
import { ModelService } from '../model.service';
import { OrganizationService } from '../../organization/organization.service';
import { Organization } from '../../organization/organization';

@Component({
  selector: 'ign-review',
  templateUrl: './review-model.component.html',
  styleUrls: ['./review-model.component.scss']
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
   */
  public modelName = '';
  /**
   * Comments that user wrote before opening the pr
   */
  public description = '';
  /**
   * list of reviwers
   */
  public reviewers: string[] = ['John', 'steven', 'mary', 'jane', 'extra guy'];
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
   * Configuration for richtext editor.
   * Refer to docs at https://www.npmjs.com/package/@kolkov/angular-editor
   */
  public editorConfig: AngularEditorConfig = {
    editable: true,
    minHeight: '15em'
  };
  /**
   * model resource object
   */
  public modelResource: FuelResource;
  /**
   * Id of review
   */
  public prId: number;
  /**
   * organization
   */
  private organization: Organization;
  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param modelService Service to request model creation
   * @param router Router to navigate to other URLs
   * @param snackBar Snackbar to display notifications
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public modelService: ModelService,
    public router: Router,
    public snackBar: MatSnackBar,
    public organizationService: OrganizationService
  ) { }

  ngOnInit(): void {
    this.modelName = this.activatedRoute.snapshot.paramMap.get('modelname');
    this.owner = this.activatedRoute.snapshot.paramMap.get('owner');
    this.getModel();
    /**
     * TODO  - determine how to get determine the id of the latest pr
     */
    this.prId = 1;

    // TODO - change the organization name
    this.getReviewers('open_robotics');
  }
  /**
   * function to create pull request
   */
  public createPullRequest(): void {
    /**
     * TODO: endpoint to store review
     */
    console.log(this.description);
    console.log(this.selectedReviewers);
    if (this.description.length === 0) {
      this.snackBar.open('Description cannot be empty.', 'Got it');
    } else if (this.selectedReviewers.length === 0) {
      this.snackBar.open('Please select a reviewer.', 'Got it');
    } else {
      this.router.navigate([
        `/${this.owner}/pr/${this.modelService.resourceType}/${this.modelName}/${this.prId}`
      ]);
    }
  }
  /**
   * delete a selected reviewer
   */
  public deleteReviewer(reviewer): void {
    this.selectedReviewers = this.selectedReviewers.filter(val => val !== reviewer);
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
   * get model
   */
  private getModel(): void {
    this.modelService.get(this.owner, this.modelName).subscribe(response => {
      this.modelResource = response;
      this.getUploadedFiles(this.modelResource);
    });
  }
  /**
   * retrieve files
   */
  private getUploadedFiles(fuelResource: FuelResource): void {
    this.modelService.getFileTree(fuelResource).subscribe(response => {
      this.files = response.file_tree;
    });
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
