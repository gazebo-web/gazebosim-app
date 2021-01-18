import { Component, OnInit, Input } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';

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
  @Input() user = '';
  @Input() modelName = '';
  @Input() prId = '';
  @Input() review;
  /**
   * Configuration for richtext editor.
   * Refer to docs at https://www.npmjs.com/package/@kolkov/angular-editor
   */
  public editorConfig: AngularEditorConfig = {
    editable: true,
    minHeight: '15em'
  };
  /**
   * receive comment from text editor
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

  constructor(
  ) { }

  ngOnInit(): void {
    console.log(this.files);
  }

  public getCommentFromEditor($event: string) {
    this.newComment = $event;
    this.addComment();
  }

  private addComment = (): void => {
    if (this.newComment) {
      const comment = {
        author: this.user,
        date: this.getDate(),
        comment: this.newComment
      };
      this.comments = [...this.comments, comment];
      this.newComment = '';
    }
    // TODO: api to post new comment to backend and error message for empty comment
  }
  public downloadFiles(): void {
    // TODO - implement downlile files method
  }

  public closeReview(): void {
    console.log("")
    // TODO - implement close review
  }

  /**
   * Get today's date in dd - month - year format
   */
  public getDate(): string {
    const monthStore = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const dd = today.getDate().toString();
    const month = monthStore[today.getMonth()];
    const year = today.getFullYear().toString();
    return dd + ' ' + month + ' ' + year;
  }

  private getComments(): void {
    // TODO - implement get comments method
  }
}
