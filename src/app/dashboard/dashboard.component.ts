import { Component, OnInit, OnDestroy } from '@angular/core';

import { CollectionService } from '../collection';
import { ModelService } from '../model/model.service';
import { WorldService } from '../world/world.service';

@Component({
  selector: 'ign-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss']
})

/**
 * Dashboard Component contains the main landing page.
 */
export class DashboardComponent implements OnInit {
  /**
   * Total number of models.
   */
  private modelCount: number = 0;

  /**
   * Total number of worlds.
   */
  private worldCount: number = 0;

  /**
   * Total number of collections.
   */
  private collectionCount: number = 0;

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
    this.modelService.getList().subscribe(
      (response) => {
        this.modelCount = response.totalCount;
      },
      (error) => {
        console.error('Error getting public models:', error);
      });

    this.worldService.getList().subscribe(
      (response) => {
        this.worldCount = response.totalCount;
      },
      (error) => {
        console.error('Error getting public worlds:', error);
      });

    this.collectionService.getCollectionList().subscribe(
      (response) => {
        this.collectionCount = response.totalCount;
      },
      (error) => {
        console.error('Error getting collections:', error);
      });
  }
}
