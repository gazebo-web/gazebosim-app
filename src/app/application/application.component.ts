import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ApplicationService } from './application.service';
import { Simulation } from './simulation';
import { PaginatedSimulation } from './paginated-simulation';

@Component({
  selector: 'ign-application',
  templateUrl: 'application.component.html',
  styleUrls: ['application.component.scss']
})

/**
 * Application Component is the page that display the details of a single application.
 */
export class ApplicationComponent implements OnInit, OnChanges  {

  public image: string;
  public name: string;
  public paginatedSimulations: PaginatedSimulation;

  /**
   * Simulation instances to be used as the table's data source.
   * This should be created when this component's Input value changes.
   */
  public dataSource: MatTableDataSource<Simulation>;

  /**
   * The columns of the table.
   */
  public columns = [
    'created_at',
    'name',
    'image',
    'status',
    'uri',
    'control',
  ];

  /**
   */
   constructor(
     public applicationService: ApplicationService,
     public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    this.updateInstances();
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

  public start(): void {
    // Form data to send to the edit request.
    const formData = new FormData();
    formData.append('image', this.image.trim());
    formData.append('name', this.name.trim());

    this.applicationService.start(formData).subscribe(
        (response) => {
          this.updateInstances();
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        });
  }

  public stop(groupid): void {
    this.applicationService.stop(groupid).subscribe(
        (response) => {
          this.updateInstances();
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        });
  }

  private updateInstances(): void {
    this.applicationService.getSimulations().subscribe(
        (response) => {
          this.paginatedSimulations = response.body.Simulations.reverse();
          this.dataSource = new MatTableDataSource(this.paginatedSimulations);
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        });
  }


}
