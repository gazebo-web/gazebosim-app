// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'ign-notifications',
//   templateUrl: './notifications.component.html',
//   styleUrls: ['./notifications.component.scss']
// })

// /**
//  * The notifications that belong to a user
// */
// export class NotificationsComponent implements OnInit {

//   public notifications: Notification[]

//   constructor() { }

//   public ngOnInit(): void {

//     // TODO: Get the User's notifications
    
//   }

// }

import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';

/**
 * @title Table with pagination
 */
@Component({
  selector: 'ign-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})

export class NotificationsComponent implements AfterViewInit {
  displayedColumns: string[] = ['title', 'author', 'action', 'date'];
  dataSource = new MatTableDataSource<Notification>(MOCK_DATA);
  reviewRequestedData = new MatTableDataSource<Notification>(REVIEW_REQUEST_MOCK_DATA);
  subscribedData = new MatTableDataSource<Notification>(SUBSCRIBED_MOCK_DATA);
  mentionedData = new MatTableDataSource<Notification>(MENTIONED_MOCK_DATA);
  
  /**
   * Active tab in the tab group.
   */
  public activeTab: 'inbox' | 'reviewRequested' | 'subscribed' | 'mentioned' = 'inbox';

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
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

export interface Notification {
  title: string;
  author: string;
  action: string;
  date: string;
}

const MOCK_DATA: Notification[] = [
  {title: "Update the thumbnail gallery", author: "@johnappleseed", action: "Review Requested", date: "23 June 2021"},
  {title: "Add a new model for review", author: "@boaringsquare", action: "Subscribed", date: "25 June 2021"},
  {title: "Changing texture of floor tiles", author: "@marycain", action: "Mentioned", date: "25 June 2021"},
];

const REVIEW_REQUEST_MOCK_DATA: Notification[] = [
  {title: "Update the thumbnail gallery", author: "@johnappleseed", action: "Review Requested", date: "23 June 2021"}
];

const SUBSCRIBED_MOCK_DATA: Notification[] = [
  {title: "Add a new model for review", author: "@boaringsquare", action: "Subscribed", date: "25 June 2021"},
];

const MENTIONED_MOCK_DATA: Notification[] = [
  {title: "Changing texture of floor tiles", author: "@marycain", action: "Mentioned", date: "25 June 2021"},
];

