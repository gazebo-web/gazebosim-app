import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { FuelResource } from 'src/app/fuel-resource';
import { ModelService } from '../model.service';
import {FormControl} from '@angular/forms';

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
  public prComments = '';
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
   * Configuration for richtext editor. Refer to docs at https://www.npmjs.com/package/@kolkov/angular-editor
   */
  public editorConfig: AngularEditorConfig = {
    minHeight: '15em'
  }
  /**
   * model resource object
   */
  public modelResource: FuelResource;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param modelService Service to request model creation
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public modelService: ModelService,
  ) { }

  ngOnInit(): void {
    this.modelName = this.activatedRoute.snapshot.paramMap.get('modelname');
    this.owner = this.activatedRoute.snapshot.paramMap.get('owner');
    this.getModel();
  }
  /**
   * Get today's date in dd - month - year format
   */
  private getDate(): string {
    const monthStore = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const dd = today.getDate().toString();
    const month = monthStore[today.getMonth() - 1];
    const year = today.getFullYear().toString();
    return dd + ' ' + month + ' ' + year;
  }
  /**
   * get model
   */
  private getModel() {
    this.modelService.get(this.owner, this.modelName).subscribe(response => {
      this.modelResource = response;
      this.getUploadedFiles(this.modelResource);
    })
  }
  /**
   * retrieve files
   */
  private getUploadedFiles(fuelResource: FuelResource) {
    this.modelService.getFileTree(fuelResource).subscribe(response => {
      this.files = response.file_tree;
    })
  }
  /**
   * function to create pull request
   */
  public createPullRequest() {
    console.log(this.prComments);
    console.log(this.selectedReviewers)
  }
  /**
   * delete a selected reviewer
   */
  public deleteReviewer(reviewer) {
    this.selectedReviewers = this.selectedReviewers.filter(val => val !== reviewer);
  }
 }
