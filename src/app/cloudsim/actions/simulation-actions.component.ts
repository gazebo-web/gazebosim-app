import { Component, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../auth/auth.service';
import { Simulation } from '../simulation';
import { SimulationService } from '../simulation.service';
import {
  ConfirmationDialogComponent
} from '../../confirmation-dialog/confirmation-dialog.component';
import { ExtraDialogComponent } from '../extra-dialog/extra-dialog.component';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'gz-simulation-actions',
  templateUrl: 'simulation-actions.component.html',
})

/**
 * Simulation Actions Component is a visual component that, given a Simulation, allows the user
 * to interact with it,
 */
export class SimulationActionsComponent {

  /**
   * The simulation that will be the target of the interactions.
   */
  @Input() public simulation: Simulation;

  /**
   * Confirmation dialog reference used to ask the user whether the simulation should stop.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * Extra dialog reference used to show the user extra information about a simulation.
   */
  private extraDialog: MatDialogRef<ExtraDialogComponent>;

  /**
   * @param authService Service to get authentication details
   * @param dialog Enables the Material Dialog
   * @param simulationService Service used to get make calls to the Simulation Server
   * @param snackBar Snackbar used to display notifications
   */
  constructor(
    public authService: AuthService,
    public dialog: MatDialog,
    public simulationService: SimulationService,
    public snackBar: MatSnackBar) {
  }

  /**
   * Stop the simulation.
   * @param event fired when stop button is clicked.
   */
  public stop(event: MouseEvent): void {

    // Prevent the propagation of the click event, to ensure only the stop action is executed.
    event.stopPropagation();

    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Stop simulation ${this.simulation.groupId}`,
        message: `<p>Are you sure you want to stop this simulation?</p>`,
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
        this.simulationService.stop(this.simulation.groupId).subscribe(
          (response) => {
            this.snackBar.open(`Simulation ${this.simulation.groupId} was stopped`, 'Got it', {
              duration: 2750
            });
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      });
  }

  /**
   * Restart the simulation
   * @param event fired when the restart simulation button is clicked.
   */
  public restart(event: MouseEvent): void {

    // Prevent the propagation of the click event, to ensure only the stop action is executed.
    event.stopPropagation();

    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Restart simulation`,
        message: `<p>Are you sure you want to restart the simulation
                  <b>${this.simulation.groupId}</b>?</p>`,
        buttonText: 'Restart',
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

        // Restart the simulation.
        this.simulationService.restart(this.simulation.groupId).subscribe(
          (response) => {
            this.snackBar.open(`Simulation ${this.simulation.groupId} was restarted`, 'Got it', {
              duration: 2750
            });
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          }
        );
      });
  }

  /**
   * Download the logs of a simulation.
   * @param event fired when the download button is clicked.
   */
  public download(event: MouseEvent): void {

    // Prevent the propagation of the click event, to ensure only the stop action is executed.
    event.stopPropagation();

    this.simulationService.download(this.simulation.groupId).subscribe(
      (response) => {
        let extension = '.tar.gz';
        if (this.simulation.multiSim === 1) {
          // Tunnel Circuit simulations only have a json file.
          extension = '.json';
        }
        const filename = `${this.simulation.name}-${this.simulation.groupId}${extension}`;
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
   * Show metadata dialog
   * @param event fired when the show metadata button is clicked.
   */
  public showMetadata(event: MouseEvent): void {
    event.stopPropagation();

    this.simulationService.getSimulation(this.simulation.groupId).subscribe(
      (response) => {
        this.extraDialog = this.dialog.open(ExtraDialogComponent, {
          data: {
            ...response
          }
        });
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * The link to the S3 bucket where the simulation logs reside.
   */
  public s3bucketLink(): string {
    // Note: In S3 the owners are encoded three times (spaces are treated as %252520).
    // Otherwise, the link would point to a non-existent folder.
    let encodedOwner = encodeURIComponent(this.simulation.owner);
    encodedOwner = encodeURIComponent(encodedOwner);
    encodedOwner = encodeURIComponent(encodedOwner);
    return `${Simulation.bucketUrl}${encodedOwner}/${this.simulation.groupId}/`;
  }
}
