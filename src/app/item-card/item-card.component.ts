import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'gz-item-card',
  templateUrl: 'item-card.component.html',
  styleUrls: ['item-card.component.scss'],
  standalone: true,
  imports: [
    AuthPipe,
    CommonModule,
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
})

/**
 * The Item Card Component is a card that can represent an asset.
 */
export class ItemCardComponent {

  /**
   * The resource to be represented by the card.
   * Used to display its content.
   */
  @Input() public resource: any;

  /**
   * The resource type to be represented by this card.
   * Used to determine the associated URLs.
   */
  @Input() public type: string;

  /**
   * Indicates whether the remove button should be displayed or not.
   */
  @Input() public removable: boolean = false;

  /**
   * Event emitted when the remove button is clicked.
   */
  @Output() public removeClicked = new EventEmitter();

  /**
   * @param authService Service to get authentication details.
   */
  constructor(public authService: AuthService) {
  }

  /**
   * Callback for the remove button click event. Emits the removeClicked event.
   */
  public onRemoveClicked(): void {
    this.removeClicked.emit({resource: this.resource, type: this.type});
  }
}
