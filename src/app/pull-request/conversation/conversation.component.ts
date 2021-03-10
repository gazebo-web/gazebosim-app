import { Component, OnInit, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ReviewComment } from '../review-comment';
import { PullRequestService } from '../pull-request.service';

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

  /**
   * model name
   */
  @Input() modelName = '';

  /**
   * pr id
   */
  @Input() prId = '';

  /**
   * review object
   */
  @Input() review;

  /**
   * comment text holder
   */
  public newComment = '';

  /**
   * list of existing comments in the pr
   */
  public comments: ReviewComment[] = [];

  /**
   * @param snackBar Snackbar to display notifications
   */
  constructor(
    public snackBar: MatSnackBar,
    public pullRequestService: PullRequestService,
  ) { }

  ngOnInit(): void {
  }

  /**
   * Add comments to comment list
   */
  public addComment(): void {
    if (this.newComment.length > 0) {
      this.pullRequestService.createComment().subscribe(res => {
        this.comments = [...this.comments, res];
      });
    } else {
      this.snackBar.open('Please enter something before commenting.', 'Got it');
    }
    // TODO: api to post new comment to backend and error message for empty comment
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
   * resolve comment
   */
  public resolveComment(resolvedComment: ReviewComment): void {
    this.comments.forEach(comment => {
      if (comment.id === resolvedComment.id) {
        comment.resolved = true;
        comment.hideComment = true;
      }
    });
  }

  public showResolvedComment(resolvedComment: ReviewComment): void {
    this.comments.forEach(comment => {
      if (comment.id === resolvedComment.id) {
        comment.hideComment = false;
      }
    });
  }

  public hideResolvedComment(resolvedComment: ReviewComment): void {
    this.comments.forEach(comment => {
      if (comment.id === resolvedComment.id) {
        comment.hideComment = true;
      }
    });
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
