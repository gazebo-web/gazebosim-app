import { Component, AfterViewInit, ViewChild, Input } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

/**
 * Table that shows the notifications that belong to a user
 */

@Component({
  selector: 'ign-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})

export class TableComponent implements AfterViewInit {
  @Input() notificationData: Notification[];
  displayedColumns: string[] = ['title', 'author', 'action', 'date'];
  dataSource: MatTableDataSource<Notification>;
  constructor() {
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource = new MatTableDataSource<Notification>(this.notificationData);
    this.dataSource.paginator = this.paginator;
  }

}

export interface Notification {
  title: string;
  author: string;
  action: string;
  date: string;
}
