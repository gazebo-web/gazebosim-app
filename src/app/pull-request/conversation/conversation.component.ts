import { Component, OnInit, Input } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ign-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent implements OnInit {
  /**
   * file array passed down from pull-request parent component. Includes all files for the model
   */
  @Input() files: File[];
  /**
   * User currently logged in
   */
  public user = '';
  /**
   * Configuration for richtext editor. Refer to docs at https://www.npmjs.com/package/@kolkov/angular-editor
   */
  public editorConfig: AngularEditorConfig = {
    editable: true,
    minHeight: '15em'
  }
  /**
   * comment text holder
   */
  public newComment = '';
  /**
   * list of existing comments in the pr
   */
  public comments = [
    {
      author: 'Johnny',
      date: '19 December 2020',
      comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
    },
    {
      author: 'Abey babe',
      date: '20 December 2020',
      comment: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
    }
  ];

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   */
  constructor(
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.user = this.activatedRoute.snapshot.paramMap.get('user');
    console.log(this.files)
  }

  public addComment() {
    if (this.newComment) {
      const comment = {
        author: this.user,
        date: this.getDate(),
        comment: this.newComment
      }
      this.comments = [...this.comments, comment];
    }
    // TODO: api to post new comment to backend and error message for empty comment
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
}
