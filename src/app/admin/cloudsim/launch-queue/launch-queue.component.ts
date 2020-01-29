import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatDialog, MatSnackBar, PageEvent } from '@angular/material';
import { QueueElement } from './queue-element';
import { SelectionModel } from '@angular/cdk/collections';
import { SimulationService } from '../../../cloudsim';
import { QueueList } from './queue-list';

@Component({
  selector: 'ign-launch-queue',
  templateUrl: 'launch-queue.component.html',
  styleUrls: ['launch-queue.component.scss']
})
export class LaunchQueueComponent implements OnInit {
  /**
   * Represents the data the table currently has in it.
   */
  public dataSource: MatTableDataSource<QueueElement>;

  /**
   * Defines the colums to be shown in the table
   */
  public readonly columns = ['select', 'groupId'];

  /**
   * Represents the list of queue elements
   */
  public list: QueueList;

  /**
   * List all the elements selected from the queue table
   */
  public selection: SelectionModel<QueueElement>;

  /**
   * Represents the actual page being set by the paginator
   */
  private paginatorPage: number = 0;

  /**
   * Represents the amount of elements to be displayed in the list
   */
  private paginatorPerPage: number = 10;

  /**
   * Represents the length of the queue array to be used by the paginator
   */
  private paginatorLength: number = 0;

  constructor(
    public dialog: MatDialog,
    public simulationService: SimulationService,
    public snackBar: MatSnackBar) {
  }

  /**
   * Initialize the table parameters, the data source, and the selection model.
   * Gets the data from server and sets an interval to refresh the data.
   */
  public ngOnInit(): void {
    this.list = new QueueList();

    this.selection = new SelectionModel<QueueElement>(true, []);
    this.dataSource = new MatTableDataSource<QueueElement>(this.list.data);

    this.refresh();
  }

  /**
   * Returns a boolean to check if all the elements from the list are selected
   */
  public isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /**
   * Toggles selection of all elements
   */
  public masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /**
   * Callback when a page event occurs
   * @param pageEvent The page event that is being fired
   */
  public pageChange(pageEvent: PageEvent): void {
    this.paginatorPage = pageEvent.pageIndex;
    this.paginatorPerPage = pageEvent.pageSize;
    this.refresh();
  }

  /**
   * Gets all the elements from the queue
   * @param page The desired page to show
   * @param perPage The amount of elements to retrieve from the API
   */
  public getPaginatedQueue(page: number, perPage: number): void {
    this.simulationService.queueGet(page, perPage).subscribe(
      (response) => {
        this.list = response;
        this.paginatorLength = this.list.totalCount;
        this.dataSource = new MatTableDataSource<QueueElement>(this.list.data);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      },
    );
  }

  /**
   * Reloads data in the table
   */
  public refresh(): void {
    this.getPaginatedQueue(this.paginatorPage, this.paginatorPerPage);
    this.selection.clear();
  }

  /**
   * Swaps two selected elements in the queue
   * @param event The event that is being fired after clicking the Swap button
   */
  public swap(event: MouseEvent): void {
    event.stopPropagation();

    const a: string = this.selection.selected[0].groupId;
    const b: string = this.selection.selected[1].groupId;

    this.simulationService.queueSwap(a, b).subscribe(
      (confirmation) => {
        this.snackBar.open('Elements have been swapped!', 'Ok', {
          duration: 3000,
        });
        this.refresh();
        return;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      },
    );

    this.selection.clear();
  }

  /**
   * Moves the selected elements to the front of the queue
   * @param event The event that is being fired after clicking the MoveToFront button
   */
  public moveToFront(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isAllSelected()) {
      this.snackBar.open('Cannot move all elements to the front of the queue', 'Got it');
      return;
    }

    this.selection.selected.forEach((item) => {
      this.simulationService.queueMoveToFront(item.groupId).subscribe(
        (response) => {
          this.refresh();
          return;
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
    });
    this.selection.clear();
  }

  /**
   * Moves the selected elements to the front of the queue
   * @param event The event that is being fired after clicking the MoveToBack button
   */
  public moveToBack(event: MouseEvent): void {
    event.stopPropagation();

    if (this.isAllSelected()) {
      this.snackBar.open('Cannot move all elements to the back of the queue', 'Got it');
      return;
    }

    this.selection.selected.forEach((item) => {
      this.simulationService.queueMoveToBack(item.groupId).subscribe(
        (response) => {
          this.refresh();
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
    });
    this.selection.clear();
  }

  /**
   * Removes the selected elements from the queue
   * @param event The event that is being fired after clicking the Remove button
   */
  public remove(event: MouseEvent): void {
    event.stopPropagation();

    this.selection.selected.forEach((item) => {
      this.simulationService.queueRemove(item.groupId).subscribe(
        (response) => {
          this.refresh();
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
    });

    this.selection.clear();
  }
}
