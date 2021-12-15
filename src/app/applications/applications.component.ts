import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import * as FileSaver from 'file-saver';

import { AuthService } from '../auth/auth.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CreditsComponent } from '../settings/credits/credits.component';
import { CreditsService } from '../settings/credits/credits.service';
import { environment } from '../../environments/environment';
import { ExtraDialogComponent } from '../cloudsim/extra-dialog/extra-dialog.component';
import { PaginatedSimulation, Simulation, SimulationService } from '../cloudsim';
import { SimulationLaunchDialogComponent } from './launch/simulation-launch-dialog.component';

@Component({
  selector: 'ign-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit, AfterViewInit {

  /**
   * Credit Component.
   */
  @ViewChild(CreditsComponent)
  public creditsComponent: CreditsComponent;

  /**
   * Minimum amount of credits required to launch a simulation.
   */
  public creditsRequired: number = parseInt(environment.CREDITS_REQUIRED, 10);

  /**
   * Simulation instances to be used as the table's data source.
   * This should be created when this component's Input value changes.
   */
  public paginatedSimulations: PaginatedSimulation;

  /**
   * The material table's data source.
   */
  public dataSource: MatTableDataSource<Simulation>;

  /**
   * The columns of the Simulations table.
   */
  public columns: string[] = [
    'startedAt',
    'name',
    'status',
    'control',
  ];

  /**
   * Dialog to upload a new simulation.
   */
  private simUploadDialog: MatDialogRef<SimulationLaunchDialogComponent>;

  /**
   * Dialog for a simulation details.
   */
  private simulationDetailsDialog: MatDialogRef<ExtraDialogComponent>;

  /**
   * Confirmation dialog.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * @param authService Used to determine the User and its authenticated status.
   * @param dialog Allows the use dialogs.
   * @param simulationService Used to get simulations from the backend.
   * @param snackBar Used to display notifications.
   */
  constructor(
    public authService: AuthService,
    public creditsService: CreditsService,
    public dialog: MatDialog,
    public simulationService: SimulationService,
    public snackBar: MatSnackBar,
  ) { }

  /**
   * On Init lifecycle hook.
   */
  ngOnInit(): void {
    this.getSimulations();
  }

  /**
   * On After View Init lifecycle hook.
   * Required to use the Credits Component.
   */
  ngAfterViewInit(): void {
    this.getCredits();
  }

  /**
   * Get simulations from the Server and update the table.
   *
   * @param params An object containing optional params for the request. They are the following:
   *               - pageSize: Number. The number of simulations per page.
   *               - page: Number. The page of simulations to get.
   */
  public getSimulations(params?: object): void {
    this.simulationService.getSimulations(params).subscribe(
      (response) => {
        this.paginatedSimulations = response;
        this.dataSource = new MatTableDataSource(response.simulations);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Get the user credits.
   */
  public getCredits(): void {
    if (this.creditsComponent) {
      this.creditsComponent.getCredits();
    }
  }

  /**
   * Callback of the paginator element, in order to get more simulations.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public pageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;
    this.getSimulations({
      pageSize: pageEvent.pageSize,
      page
    });
  }

  /**
   * Opens the Dialog used to launch a Simulation.
   */
  public openLaunchDialog(): void {
    // Check for credits and warn the user if necessary.
    if (this.creditsComponent && this.creditsComponent.credits < this.creditsRequired) {
      this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, {
        data: {
          title: `Not enough credits`,
          message: `<p>You don't have enough credits to launch a simulation. A minimum of ${this.creditsRequired} is required.</p>
                    <p>Please purchase <a href="/settings#credits">credits here</a>.</p>`,
          buttonText: 'OK',
        }
      });
      return;
    }

    const dialogOps = {
      data: {
        user: this.authService.userProfile.username,
      }
    };
    this.simUploadDialog = this.dialog.open(SimulationLaunchDialogComponent, dialogOps);

    // Subscribe to the event coming from the Dialog.
    const sub: Subscription = this.simUploadDialog.componentInstance.onSubmit.subscribe(
      (form) => {
        this.simulationService.launch(form).subscribe(
          (simulation) => {
            this.snackBar.open(`Simulation ${simulation.name} was launched`, 'Got it', {
              duration: 2750
            });
            this.getSimulations();
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );

    // Unsubscribe from the dialog event.
    this.simUploadDialog.afterClosed().subscribe(() => sub.unsubscribe());
  }

  /**
   * Show the details of a simulation.
   *
   * @param simulation The Simulation to show the details of.
   */
  public showDetails(simulation: Simulation): void {
    this.simulationDetailsDialog = this.dialog.open(ExtraDialogComponent, {
      data: {
        ...simulation,
      }
    });
  }

  /**
   * Stop a running simulation.
   *
   * @param simulation The Simulation to stop.
   */
  public stop(simulation: Simulation): void {
    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Stop simulation ${simulation.name}`,
        message: `<p>Are you sure you want to stop this simulation?</p>
                  <p>You will be charged for the simulation time used, but you will not spend further credits on it.</p>`,
        buttonText: 'Stop',
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed().subscribe(
      (result) => {
        // Filters any result that is not the main action.
        if (result !== true) {
          return;
        }

        // Stop the simulation.
        this.simulationService.stop(simulation.groupId).subscribe(
          (response) => {
            this.snackBar.open(`Simulation ${simulation.name} was stopped`, 'Got it', {
              duration: 2750
            });
            this.getCredits();
            this.getSimulations();
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      }
    );
  }

  /**
   * Get the logs of a simulation or robot.
   *
   * @param simulation The Simulation to get logs of.
   * @param robotName Optional. The name of the robot to get logs of.
   */
  public getLogs(simulation: Simulation, robotName?: string): void {
    this.simulationService.getLogs(simulation, robotName).subscribe(
      (response) => {
        const filename = `${simulation.name}.tar.gz`;
        FileSaver.saveAs(response, filename);
      },
      (error) => {
        if (error.status === 404) {
          this.snackBar.open('There are no logs to download', 'Got it', { duration: 2750 });
        }
      }
    );
  }

  /**
   * Opens the Information Dialog.
   */
  public openInfoDialog(): void {
    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: `Applications`,
        message: `
          <p>
            Applications are cloud hosted simulation instances. An example is application is the
            <a href='https://github.com/osrf/subt'>SubT Simulator</a>.
          </p>

          <p>
            <a href='https://openrobotics.freshdesk.com/support/solutions/43000370684'>
              Click here for more information about applications
            </a>
          </p>`,
        buttonText: 'OK',
      }
    });
  }
}
