import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { AdminElasticsearchService } from './admin-elasticsearch.service';
import { ElasticsearchConfig } from './elasticsearch-config';
import { ElasticsearchConfigDialogComponent } from './config-dialog/config-dialog.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'gz-admin-elasticsearch',
  templateUrl: 'admin-elasticsearch.component.html',
  styleUrls: ['admin-elasticsearch.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
})

/**
 * Admin Elasticsearch Component is the page that displays search related
 * information to system admins.
 */
export class AdminElasticsearchComponent implements OnInit {

  /**
   * The columns of the table.
   */
  public columns = [
    'id',
    'address',
    'username',
    'password',
    'primary',
    'controlButtons',
  ];

  /**
   * Configuration to be used as the table's data source.
   */
  public dataSource: MatTableDataSource<ElasticsearchConfig>;

  /**
   * True to hide the password field.
   */
  public hide = true;

  /**
   * All of the elastic search configs.
   */
  private configs: ElasticsearchConfig[] = [];

  /**
   * Dialog to create or alter an elastic search config.
   */
  private configDialog: MatDialogRef<ElasticsearchConfigDialogComponent>;

  /**
   * @param snackbar Snackbar used to show notifications.
   * @param dialog Dialog that support adding and modify a configuration.
   * @param elasticService The ElasticSearch service.
   */
   constructor(
     public snackBar: MatSnackBar,
     public dialog: MatDialog,
     private elasticService: AdminElasticsearchService) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Get the search configurations to display.
   */
  public ngOnInit(): void {
    this.getConfigs();
  }

  /**
   * Reconnect to the elasticsearch instance
   */
  public reconnect(): void {
    this.elasticService.reconnect().subscribe(
      (response) => {
        this.snackBar.open(response.status, 'Got it');
      },
      (error) => {
        this.snackBar.open(`${error.message}`, 'Got it');
      });
  }

  /**
   * Rebuild the elasticsearch indices
   */
  public rebuild(): void {
    this.elasticService.rebuild().subscribe(
      (response) => {
        this.snackBar.open(response.status, 'Got it');
      },
      (error) => {
        this.snackBar.open(`${error.message}`, 'Got it');
      });
  }

  /**
   * Update the elasticsearch indices
   */
  public update(): void {
    this.elasticService.update().subscribe(
      (response) => {
        this.snackBar.open(response.status, 'Got it');
      },
      (error) => {
        this.snackBar.open(`${error.message}`, 'Got it');
      });
  }

  /**
   * Delete the elasticsearch config
   */
  public delete(configId: number): void {
    this.elasticService.delete(configId).subscribe(
      (response) => {
        for (let i = 0; i < this.configs.length; i++) {
          if (this.configs[i].id === configId) {
            this.configs.splice(i, 1);
          }
        }
        this.dataSource = new MatTableDataSource(this.configs);
        this.snackBar.open(`Removed ${configId}`, 'Got it');
      },
      (error) => {
        this.snackBar.open(`${error.message}`, 'Got it');
      });
  }

  /**
   * Set a config to primary
   */
  public setPrimary(configId: number): void {
    for (const cfg of this.configs) {
      if (cfg.id === configId) {
        this.elasticService.modify(configId, {
          address: cfg.address,
          username: cfg.username,
          password: cfg.password,
          primary: true
        }).subscribe(
          (response) => {
            this.getConfigs();
          });
        break;
      }
    }
  }

  /**
   * Add a new config.
   */
  public addConfig(): void {
    this.configDialog = this.dialog.open(ElasticsearchConfigDialogComponent,
      null);

    // Subscribes to the close event of the dialog.
    this.configDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        this.elasticService.create(result).subscribe(
          (response) => {
            this.configs.push(response);
            this.dataSource = new MatTableDataSource(this.configs);
          });
        this.configDialog.close();
      }
    );
  }

  /**
   * Modify a config.
   */
  public modify(config: ElasticsearchConfig): void {
    const dialogOps = {
      data: {
        address: config.address,
        username: config.username,
        password: config.password,
      }
    };

    this.configDialog = this.dialog.open(ElasticsearchConfigDialogComponent,
      dialogOps);

    // Subscribes to the close event of the dialog.
    this.configDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        this.elasticService.modify(config.id, result).subscribe(
          (response) => {
            for (let i = 0; i < this.configs.length; ++i) {
              if (this.configs[i].id === response.id) {
                this.configs[i] = response;
                break;
              }
            }
            this.dataSource = new MatTableDataSource(this.configs);
          });
        this.configDialog.close();
      }
    );
  }

  /**
   * Get the configurations
   */
  private getConfigs(): void {
    this.elasticService.getList().subscribe(
      (configurations) => {
        this.configs = configurations;
        this.dataSource = new MatTableDataSource(configurations);
      });
  }
}
