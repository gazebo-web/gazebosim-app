import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ign-pull-request',
  templateUrl: './pull-request.component.html',
  styleUrls: ['./pull-request.component.scss']
})
export class PullRequestComponent implements OnInit {

  /**
   * list of selected reviewers, if any
   */
  public selectedReviewers = ['steven', 'mary'];
  /**
   * list of reviwers
   */
  public reviewers: string[] = ['John', 'steven', 'mary', 'jane', 'extra guy'];

  public fakeFiles = this.generateFakeFiles();

  constructor() { }

  ngOnInit(): void {
  }

  private generateFakeFiles(): File[] {
    const file1 = new File([], 'file.png', {type: 'image/png'});
    const file2 = new File([], 'file.config', {type: ''});
    const file3 = new File([], 'file.sdf', {type: ''});
    return [file1, file2, file3];
  }
}
