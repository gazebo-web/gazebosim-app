import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { MatTableDataSource, MatSelectChange, MatSnackBar, PageEvent } from '@angular/material';
import { AuthService } from '../../auth/auth.service';
import { PaginatedSimulation, Simulation, SimulationService } from '../../cloudsim';

@Component({
  selector: 'ign-simulation-table',
  templateUrl: 'simulation-table.component.html',
  styleUrls: ['simulation-table.component.scss']
})

/**
 * The Simulation Table Component is a reusable table that contains an array of simulations.
 */
export class SimulationTableComponent implements OnChanges {

  /**
   * The paginated simulations to be represented.
   */
  @Input() public paginatedSimulations: PaginatedSimulation;

  /**
   * The Status List for filtering purposes.
   */
  public statusList: string[] = Simulation.StatusList;

  /**
   * The Error Status List for filtering purposes.
   */
  public errorStatusList: string[] = [
    'TerminationFailed',
    'InitializationFailed',
    'AdminReview',
    'FailedToUploadLogs',
    'Rejected',
  ];

  /**
   * The dropdown circuit list
   */
  public circuitList: string[] = [
    'Tunnel Circuit',
    'Tunnel Practice 1',
    'Tunnel Practice 2',
    'Tunnel Practice 3',
    'Simple Tunnel 1',
    'Simple Tunnel 2',
    'Simple Tunnel 3',
    'Urban Qualification',
    'Urban Simple 1',
    'Urban Simple 2',
    'Urban Simple 3',
    'Urban Practice 1',
    'Urban Practice 2',
    'Urban Practice 3',
    'Urban Circuit',
  ];

  /**
   * The columns of the table.
   */
  public columns = [
    'name',
    'owner',
    'groupId',
    'status',
    'startedAt',
    'controlButtons',
  ];

  /**
   * The selected Status for filtering.
   */
  public statusFilter: string;

  /**
   * The selected Error Status for filtering.
   */
  public errorStatusFilter: string;

  /**
   * The selected circuit for filtering.
   */
  public circuitFilter: string;

  /**
   * Simulation instances to be used as the table's data source.
   * This should be created when this component's Input value changes.
   */
  public dataSource: MatTableDataSource<Simulation>;

  /**
   * @param authService Service to get authentication details.
   * @param simulationService Service used to get simulations from the Server.
   * @param snackBar Snackbar used to display notifications to the user.
   */
  constructor(
    public authService: AuthService,
    public simulationService: SimulationService,
    public snackBar: MatSnackBar) {
  }

  /**
   * OnChange lifecycle hook.
   *
   * It is triggered by changes on the Input fields, in this case, the simulations.
   * This creates the data source for the Material table.
   *
   * @param changes The simple changes event, that contains the current and previous values.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    const newPaginatedSimulations = changes.paginatedSimulations.currentValue;
    if (newPaginatedSimulations) {
      this.dataSource = new MatTableDataSource(newPaginatedSimulations.simulations);
    }
  }

  /**
   * Callback from the Status dropdown. Get the simulations of the selected status.
   */
  public filterByStatus() {
    this.getSimulations({
      status: this.statusFilter,
      errorStatus: this.errorStatusFilter
    });
  }

  /**
   * Callback of the paginator element, in order to get more simulations.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public pageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;
    this.getSimulations({
      status: this.statusFilter,
      errorStatus: this.errorStatusFilter,
      page
    });
  }

  /**
   * Get simulations from the Server and update the table.
   *
   * @param params An object containing optional params for the request. They are the following:
   *               - status: String. The request will return only instances with this status.
   *               - errorStatus: String. The request will return only instances with this error
   *                              status.
   *               - page: Number. The page of simulations to get.
   */
  public getSimulations(params?: object): void {
    this.simulationService.getSimulations({children: true, ...params}).subscribe(
      (response) => {
        this.paginatedSimulations = response;
        this.dataSource = new MatTableDataSource(response.simulations);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }
}
