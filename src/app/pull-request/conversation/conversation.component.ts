import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

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
   * @param snackBar Snackbar to display notifications
   */
  constructor(
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    console.log(this.files);
  }

  public addComment(): void {
    if (this.newComment.length > 0) {
      const comment = {
        author: this.user,
        date: this.getDate(),
        comment: this.newComment
      };
      this.comments = [...this.comments, comment];
    } else {
      this.snackBar.open('Please enter something before commenting.', 'Got it');
    }
    // TODO: api to post new comment to backend and error message for empty comment
  }
  public downloadFiles(): void {
    // TODO - implement downlile files method
  }

  /**
   * Close a pull request
   */
  public closeReview(): void {
    // TODO - implement close review
  }

   /**
   * Modify the comment based on the event received.
   *
   * @param comment The modified comment.
   */
  public onModifyDescription(comment: string): void {
    this.newComment = comment;
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

  private getComments(): void {
    // TODO - implement get comments method
  }
}
