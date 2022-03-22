import { OnInit, Component } from '@angular/core';
import { Notification } from './notifications-table/notifications-table.component';

/**
 * Notifications component
 */
@Component({
  selector: 'ign-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})

export class NotificationsComponent implements OnInit {
  public inboxData: Notification[];
  public reviewRequestedData: Notification[];
  public subscribedData: Notification[];
  public mentionedData: Notification[];

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'inbox' | 'reviewRequested' | 'subscribed' | 'mentioned' = 'inbox';

  public ngOnInit(): void {
    // TODO: retrieve notification data from server
    this.inboxData = [
      {title: 'Update the thumbnail gallery', author: '@johnappleseed',
      action: 'Review Requested', date: '23 June 2021'},
      {title: 'Add a new model for review', author: '@boaringsquare',
      action: 'Subscribed', date: '25 June 2021'},
      {title: 'Changing texture of floor tiles', author: '@marycain',
      action: 'Mentioned', date: '25 June 2021'},
    ];
    this.reviewRequestedData = [
      {title: 'Update the thumbnail gallery', author: '@johnappleseed',
      action: 'Review Requested', date: '23 June 2021'}
    ];
    this.subscribedData = [
      {title: 'Add a new model for review', author: '@boaringsquare',
      action: 'Subscribed', date: '25 June 2021'}
    ];
    this.mentionedData = [
      {title: 'Changing texture of floor tiles', author: '@marycain',
      action: 'Mentioned', date: '25 June 2021'}
    ];
  }

  /**
   * Callback when the tab is changed. Determines the current active tab.
   */
  public setActiveTab(event: number): void {
    switch (event) {
      case 0: {
        this.activeTab = 'inbox';
        break;
      }
      case 1: {
        this.activeTab = 'reviewRequested';
        break;
      }
      case 2: {
        this.activeTab = 'subscribed';
        break;
      }
      case 3: {
        this.activeTab = 'mentioned';
        break;
      }
    }
  }
}
