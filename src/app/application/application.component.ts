import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ApplicationService } from './application.service';
import { Simulation } from './simulation';
import { PaginatedSimulation } from './paginated-simulation';
import { Subscription, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

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
  public credits: number = 0;
  public paginatedSimulations: PaginatedSimulation;
  private sub: Subscription;

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
     public authService: AuthService,
     public userService: UserService,
     public applicationService: ApplicationService,
     public snackBar: MatSnackBar) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const source = timer(0, 60000);
      this.sub = source.subscribe(val => { this.updateInstances(); });

      this.updateCredits();
    }
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
    if (this.credits <= 0) {
      this.snackBar.open('Insufficient credits', 'Got it');
      return;
    }

    // Form data to send to the edit request.
    const formData = new FormData();
    formData.append('image', this.image.trim());
    formData.append('name', this.name.trim());

    this.applicationService.start(formData).subscribe(
        (response) => {
          this.updateInstances();
          this.updateCredits();
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
    this.applicationService.simulations().subscribe(
        (response) => {
          this.paginatedSimulations = response.body.Simulations.reverse();
          this.dataSource = new MatTableDataSource(response.body.Simulations);
        },
        (error) => {
          this.snackBar.open(`${error.message}`, 'Got it');
        });
  }

  /**
   * Get the latest credits for the user.
   */
  private updateCredits(): void {
      this.userService.getAccountInfo("nate").subscribe(
        (response) => {
          this.credits = response.CloudsimCredit;
          });
  }
}
