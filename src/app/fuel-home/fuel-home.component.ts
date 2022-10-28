import { Component, OnInit, OnDestroy } from '@angular/core';

import { CollectionService, Collection } from '../collection';
import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';

@Component({
  selector: 'gz-fuel-home',
  templateUrl: 'fuel-home.component.html',
  styleUrls: ['fuel-home.component.scss']
})

/**
 * FuelHome Component contains the landing page for the fuel component.
 */
export class FuelHomeComponent implements OnInit, OnDestroy {

  /**
   * Latest models to display.
   */
  public models: Model[];

  /**
   * Latest worlds to display.
   */
  public worlds: World[];

  /**
   * Latest collections to display.
   */
  public collections: Collection[];

  /**
   * Number of items to be displayed for each resource type.
   */
  private displayCount: number = 4;

  /**
   * Subscription to the NavigationEnd router event.
   */
  private navigationSubscription: Subscription;

  /**
   * @param collectionService Service to retrieve collections
   * @param modelService Service to retrieve models
   * @param router The router to subscribe to its events.
   * @param worldService Service to retrieve worlds
   */
  constructor(
    private collectionService: CollectionService,
    private modelService: ModelService,
    private router: Router,
    private worldService: WorldService) {
  }

  /**
   * OnInit lifecycle hook.
   *
   * Get the resources to display and subscribes to the NavigationEnd event, in order to get
   * the resources whenever a navigation tries to reload this page from the same URL.
   */
  public ngOnInit(): void {
    // Get the resources to display. Note that this will happen once, as the OnInit lifecycle hook
    // happens after a Navigation End event.
    this.getResources();

    // Subscribes to the Navigation End event.
    this.navigationSubscription = this.router.events.subscribe(
      (event) => {
        if (event instanceof NavigationEnd) {
          this.getResources();
        }
      }
    );
  }

  /**
   * OnDestroy lifecycle hook.
   *
   * Unsubscribes from the router event.
   */
  public ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  /**
   * Get the models, worlds and collections to display.
   */
  public getResources(): void {
    this.modelService.getList({per_page: this.displayCount}).subscribe(
      (models) => {
        if (models !== undefined) {
          this.models = models.resources;
        }
      },
      (error) => {
        console.error('Error getting public models:', error);
      });

    this.worldService.getList({per_page: this.displayCount}).subscribe(
      (worlds) => {
        if (worlds !== undefined) {
          this.worlds = worlds.resources;
        }
      },
      (error) => {
        console.error('Error getting public worlds:', error);
      });

    this.collectionService.getCollectionList({per_page: this.displayCount}).subscribe(
      (paginatedCollection) => {
        if (paginatedCollection !== undefined) {
          this.collections = paginatedCollection.collections;
        }
      },
      (error) => {
        console.error('Error getting collections:', error);
      });
  }
}
