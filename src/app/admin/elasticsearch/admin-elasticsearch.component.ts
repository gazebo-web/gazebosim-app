import { Component, OnInit  } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatTableDataSource,
  MatSelectChange,
  MatSnackBar,
  MatButton,
  MatCheckbox,
  PageEvent
} from '@angular/material';

import { AdminElasticsearchService } from './admin-elasticsearch.service';
import { ElasticsearchConfig } from './elasticsearch-config';
import { ElasticsearchConfigDialogComponent } from './config-dialog/config-dialog.component';

@Component({
  selector: 'ign-admin-elasticsearch',
  templateUrl: 'admin-elasticsearch.component.html',
  styleUrls: ['admin-elasticsearch.component.scss']
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
   * All of the elastic search configs.
   */
  private configs: ElasticsearchConfig[] = [];

  /**
   * True to hide the password field.
   */
  private hide = true;

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
   * Get the configurations
   */
  private getConfigs(): void {
    this.elasticService.getList().subscribe(
      (configurations) => {
        this.configs = configurations;
        this.dataSource = new MatTableDataSource(configurations);
      });
  }

  /**
   * Reconnect to the elasticsearch instance
   */
  private reconnect(): void {
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
  private rebuild(): void {
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
  private update(): void {
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
  private delete(configId: number): void {
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
  private setPrimary(configId: number): void {
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
  private addConfig(): void {
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
  private modify(config: ElasticsearchConfig): void {
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

}
