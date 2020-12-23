import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AngularEditorConfig } from '@kolkov/angular-editor';

@Component({
  selector: 'ign-review',
  templateUrl: './review-model.component.html',
  styleUrls: ['./review-model.component.scss']
})
export class ReviewComponent implements OnInit {

  /**
   * fake branch name, need to remove later
   */
  public fakeBranch = 'base:main';
  public modelName = '';
  public prText = `test a longer string to test selection. <b>If you want</b> to motivate these clowns then tryless carrots and more stciks. Win win incentive. Eat our own dog food. Is this sentence long enough? blah blah blah. Once upon a time, there was a wise man called Aesop`;
  public reviewers: string[] = ['John', 'steven', 'mary', 'jane', 'extra guy'];
  public selectedReviewer = '';
  public date = this.getDate();
  public fakeFiles = this.getMockFiles();
  public editorConfig: AngularEditorConfig = {
    minHeight: '15em'
  }

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   */
  constructor(
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.modelName = this.activatedRoute.snapshot.paramMap.get('modelname');
  }

  private getDate(): string {
    const monthStore = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const dd = today.getDate().toString();
    const month = monthStore[today.getMonth() - 1];
    const year = today.getFullYear().toString();
    return dd + ' ' + month + ' ' + year;
  }

  private getMockFiles(): File[] {
    const blobPic = new Blob([""], { type: 'image/png' });
    blobPic["lastModifiedDate"] = "";
    blobPic["name"] = "model.png";
    const file1 = <File>blobPic;

    const blobConf = new Blob([""], { type: '' });
    blobConf["lastModifiedDate"] = "";
    blobConf["name"] = "model.config";
    const file2 = <File>blobConf;

    const blobSdf = new Blob([""], { type: '' });
    blobSdf["lastModifiedDate"] = "";
    blobSdf["name"] = "model.sdf";
    const file3 = <File>blobSdf;

    return [file1, file2, file3];
  }

  public deleteFile(file: File) {
    console.log(file);
  }

  public createPullRequest() {
    console.log(this.prText);
  }
 }
