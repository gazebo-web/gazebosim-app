import { OnInit, Component } from '@angular/core';

/**
 * Notifications component
 */
@Component({
  selector: 'ign-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})

export class NotificationsComponent implements OnInit {
  // TODO: retrieve notification data from server
  inboxData = [
    {title: 'Update the thumbnail gallery', author: '@johnappleseed',
    action: 'Review Requested', date: '23 June 2021'},
    {title: 'Add a new model for review', author: '@boaringsquare',
    action: 'Subscribed', date: '25 June 2021'},
    {title: 'Changing texture of floor tiles', author: '@marycain',
    action: 'Mentioned', date: '25 June 2021'},
  ];
  reviewRequestedData = [
    {title: 'Update the thumbnail gallery', author: '@johnappleseed',
    action: 'Review Requested', date: '23 June 2021'}
  ];
  subscribedData = [
    {title: 'Add a new model for review', author: '@boaringsquare',
    action: 'Subscribed', date: '25 June 2021'}
  ];
  mentionedData = [
    {title: 'Changing texture of floor tiles', author: '@marycain',
    action: 'Mentioned', date: '25 June 2021'}
  ];

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'inbox' | 'reviewRequested' | 'subscribed' | 'mentioned' = 'inbox';

  public ngOnInit(): void {
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
