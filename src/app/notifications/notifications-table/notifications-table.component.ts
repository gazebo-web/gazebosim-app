import { Component, AfterViewInit, ViewChild, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

/**
 * Table that shows the notifications that belong to a user
 */

@Component({
  selector: 'ign-notifications-table',
  templateUrl: './notifications-table.component.html',
  styleUrls: ['./notifications-table.component.scss']
})

export class NotificationsTableComponent implements AfterViewInit {
  @Input() notificationData: Notification[];
  displayedColumns: string[] = ['title', 'author', 'action', 'date'];
  dataSource: MatTableDataSource<Notification>;
  constructor() {
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  public createDataSource(): void {
    this.dataSource = new MatTableDataSource<Notification>(this.notificationData);
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => {
      this.createDataSource();
      this.dataSource.paginator = this.paginator;
    });
  }

}

export interface Notification {
  title: string;
  author: string;
  action: string;
  date: string;
}
