import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { LaunchQueueComponent } from './launch-queue/launch-queue.component';
import { Machine, PaginatedMachine, Simulation, PaginatedSimulation, SimulationService, SimulationTableComponent } from '../../cloudsim';
import { PaginatedSimulationRules } from './rules';
import { SimulationRulesComponent } from './rules/simulation-rules.component';
import { SimVisualizerComponent } from './visualizer-tester/sim-visualizer-tester.component';

@Component({
  selector: 'gz-admin-cloudsim',
  templateUrl: 'admin-cloudsim.component.html',
  styleUrls: ['admin-cloudsim.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LaunchQueueComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    ReactiveFormsModule,
    SimulationRulesComponent,
    SimulationTableComponent,
    SimVisualizerComponent,
  ],
})

/**
 * Admin Cloudsim Component is the page that displays Cloudsim related information to system admins.
 */
export class AdminCloudsimComponent implements OnInit {

  /**
   * Machine instance table columns to display
   */
  public machineDisplayedColumns = ['groupId', 'status', 'startedAt'];

  /**
   * The Machine Status List for filtering purposes.
   */
  public machineStatusList: string[] = Machine.StatusList;

  /**
   * The selected Status for filtering the machines.
   */
  public machineStatusFilter: string;

  /**
   * The selected groupId for filtering the machines.
   */
  public machineGroupIdFilter: string;

  /**
   * Paginated Simulations to display in the Simulation Table.
   */
  public paginatedSimulations: PaginatedSimulation;

  /**
   * Paginated Machines to display in the Table.
   */
  public paginatedMachines: PaginatedMachine;

  /**
   * Paginated Simulation Rules to display in the Rules Component.
   */
  public paginatedRules: PaginatedSimulationRules;

  /**
   * Machine instance data source
   */
  public machineDataSource: MatTableDataSource<Machine>;

  /**
   * Link to the Simulations S3 Bucket.
   */
  public simulationsBucketLink = Simulation.bucketUrl;

  /**
   * @param simulationService Service used to communicate with the Simulation Server.
   * @param snackbar Snackbar used to show notifications.
   */
   constructor(
     private simulationService: SimulationService,
     public snackBar: MatSnackBar) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Get the simulations and machines to display.
   */
  public ngOnInit(): void {
    this.getSimulations();
    this.getMachines();
    this.getRules();
  }

  /**
   * Get the simulations to display.
   */
  public getSimulations(): void {
    this.simulationService.getSimulations({children: true}).subscribe(
      (paginatedSim) => {
        if (paginatedSim !== undefined) {
          this.paginatedSimulations = paginatedSim;
        }
      },
      (error) => {
        console.error('Error getting simulations:', error);
      });
  }

  /**
   * Get the simulation rules to display.
   */
  public getRules(): void {
    this.simulationService.getRules().subscribe(
      (paginatedRules) => {
        if (paginatedRules !== undefined) {
          this.paginatedRules = paginatedRules;
        }
      },
      (error) => {
        console.error('Error getting simulation rules:', error);
      });
  }

  /**
   * Callback from the Status dropdown. Get the machines of the selected status.
   *
   * @param change Change triggered by the dropdown element.
   */
  public filterByStatus(change: MatSelectChange): void {
    this.machineStatusFilter = change.value;
    this.getMachines(this.machineStatusFilter, this.machineGroupIdFilter);
    this.getRules();
  }

  /**
   * Callback from the GroupId input. Get the machines with the specified
   * groupId.
   *
   * @param groupId Machine group id string.
   */
  public filterByGroupId(groupId: string): void {
    this.machineGroupIdFilter = groupId.trim();
    this.getMachines(this.machineStatusFilter, this.machineGroupIdFilter);
    this.getRules();
  }

  /**
   * Callback of the paginator element, in order to get more machines.
   *
   * @param pageEvent The event from the Paginator. Contains the page to get.
   */
  public pageChange(pageEvent: PageEvent): void {
    const page = pageEvent.pageIndex + 1;
    this.getMachines(this.machineStatusFilter, this.machineGroupIdFilter, page);
  }

  /**
   * Get machines from the Server and update the table.
   *
   * @param status The status of the simulations to filter.
   * @param page Optional. The page number to get.
   */
  public getMachines(status: string = '', groupId: string = '',
                     page?: number): void {
    this.simulationService.getMachines({status, groupId, page}).subscribe(
      (response) => {
        this.paginatedMachines = response;
        this.machineDataSource = new MatTableDataSource(response.machines);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }
}
