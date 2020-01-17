import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatSnackBar, PageEvent } from '@angular/material';

import { PortalService, PaginatedLeaderBoardEntry, LeaderBoardEntry } from '../../portal';

@Component({
  selector: 'ign-leaderboard',
  templateUrl: 'leaderboard.component.html',
  styleUrls: ['../portal.component.scss']
})

/**
 * The Leader Board Component is a reusable table that contains a list of participants and their
 * score.
 */
export class LeaderBoardComponent implements OnInit {

  /**
   * The entries of the leader board.
   */
  public paginatedEntries: PaginatedLeaderBoardEntry;

  /**
   * Columns of the leader board.
   */
  public displayedColumns: string[] = ['participant', 'score'];

  /**
   * Data source for the leader board's Material Table.
   */
  public dataSource: MatTableDataSource<LeaderBoardEntry>;

  /**
   * @param portalService Service used to handle portals from the Server.
   * @param snackBar Snackbar used to display notifications
   */
  constructor(
    public portalService: PortalService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Retrieves the leader board entries from the Server.
   */
  public ngOnInit(): void {
    this.getEntries();
  }

  /**
   * Callback of the paginator element, in order to get more entries of the leader board.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public pageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;
    this.getEntries(page);
  }

  /**
   * Get entries in the leader board
   * .
   * @param page Optional. The page to get from the server.
   */
  public getEntries(page?: number): void {
    this.portalService.getScore(page).subscribe(
      (response) => {
        this.paginatedEntries = response;
        this.dataSource = new MatTableDataSource(response.entries);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }
}
