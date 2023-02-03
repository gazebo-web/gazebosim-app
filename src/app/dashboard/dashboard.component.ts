import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CollectionService, Collection } from '../collection';
import { ItemCardComponent } from '../item-card/item-card.component';
import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';

@Component({
  selector: 'gz-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    ItemCardComponent,
    MatIconModule,
    RouterModule,
  ],
})

/**
 * Dashboard Component contains the main landing page.
 */
export class DashboardComponent implements OnInit {
  /**
   * Latest models to display.
   */
  public models: Model[];

  /**
   * The number of models in the Fuel Server.
   */
  public modelsQuantity: number;

  /**
   * Latest worlds to display.
   */
  public worlds: World[];

  /**
   * The number of worlds in the Fuel Server.
   */
  public worldsQuantity: number;

  /**
   * Latest collections to display.
   */
  public collections: Collection[];

  /**
   * The number of collections in the Fuel Server.
   */
  public collectionsQuantity: number;

  /**
   * Number of items to be displayed for each resource type.
   */
  private displayCount: number = 4;

  /**
   * @param collectionService Service to retrieve collections
   * @param modelService Service to retrieve models
   * @param router The router to subscribe to its events.
   * @param worldService Service to retrieve worlds
   */
  constructor(
    private collectionService: CollectionService,
    private modelService: ModelService,
    private worldService: WorldService) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Get the resources to display.
   */
  public ngOnInit(): void {
    this.modelService.getList({per_page: this.displayCount}).subscribe(
      (models) => {
        if (models !== undefined) {
          this.models = models.resources;
          this.modelsQuantity = models.totalCount;
        }
      },
      (error) => {
        console.error('Error getting public models:', error);
      });

    this.worldService.getList({per_page: this.displayCount}).subscribe(
      (worlds) => {
        if (worlds !== undefined) {
          this.worlds = worlds.resources;
          this.worldsQuantity = worlds.totalCount;
        }
      },
      (error) => {
        console.error('Error getting public worlds:', error);
      });

    this.collectionService.getCollectionList({per_page: this.displayCount}).subscribe(
      (collections) => {
        if (collections !== undefined) {
          this.collections = collections.collections;
          this.collectionsQuantity = collections.totalCount;
        }
      },
      (error) => {
        console.error('Error getting collections:', error);
      });
  }
}
