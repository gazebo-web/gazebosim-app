import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';

@Component({
  selector: 'gz-search',
  templateUrl: 'search.component.html',
  styleUrls: ['search.component.scss']
})

/**
 * Search Component displays the information regarding a search query.
 */
export class SearchComponent implements OnInit, OnDestroy {

  /**
   * The list of search models.
   */
  public models: Model[];

  /**
   * The paginated Models returned from the Server.
   */
  public paginatedModels: PaginatedModels;

  /**
   * The list of search worlds.
   */
  public worlds: World[];

  /**
   * The paginated Worlds returned from the Server.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'models' | 'worlds' = 'models';

  /**
   * Subscription to the route's params.
   */
  private paramsSubscription: Subscription;

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param modelService Service used to search for models.
   * @param snackBar Snackbar used to display notifications.
   * @param worldService Service used to search for worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public modelService: ModelService,
    public snackBar: MatSnackBar,
    public worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    let search: string;
    // This subscription makes the search re-run if the user changes params.
    this.activatedRoute.params.subscribe((params: Params) => {
      search = params['q'];

      // Replace ampersand with %26 so that it gets sent over the wire
      // correctly.
      // todo: Consider supporting form search, instead of only a single "?q"
      // parameter.
      if (search !== null && search !== undefined) {
        search = search.replace(/&/gi, '%26');
      }

      this.modelService.getList(search).subscribe(
        (models) => {
          if (models !== undefined) {
            this.paginatedModels = models;
            this.models = models.resources;
          }
        },
        (error) => {
          console.error('Error searching for models', error);
          this.snackBar.open(error.message, 'Got it');
        }
      );

      this.worldService.getList(search).subscribe(
        (worlds) => {
          if (worlds !== undefined) {
            this.paginatedWorlds = worlds;
            this.worlds = worlds.resources;
          }
        },
        (error) => {
          console.error('Error searching for worlds:', error);
          this.snackBar.open(error.message, 'Got it');
        }
      );
    });
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Unsubscribes from the router.
   */
  public ngOnDestroy(): void {
    if (this.paramsSubscription) {
      this.paramsSubscription.unsubscribe();
    }
  }

  /**
   * Loads the next page of models.
   */
  public loadNextModelsPage(): void {
    if (this.paginatedModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedModels).subscribe(
        (pagModels) => {
          this.paginatedModels = pagModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.models.slice();
          for (const model of pagModels.resources) {
            newModels.push(model);
          }
          this.models = newModels;
        }
      );
    }
  }

  /**
   * Loads the next page of worlds.
   */
  public loadNextWorldsPage(): void {
    if (this.paginatedWorlds.hasNextPage()) {
      this.worldService.getNextPage(this.paginatedWorlds).subscribe(
        (pagWorlds) => {
          this.paginatedWorlds = pagWorlds;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.worlds.slice();
          for (const world of pagWorlds.resources) {
            newWorlds.push(world);
          }
          this.worlds = newWorlds;
        }
      );
    }
  }

  /**
   * Callback when the tab is changed. Determines the current active tab.
   */
  public setActiveTab(event: number): void {
    switch (event) {
      case 0: {
        this.activeTab = 'models';
        break;
      }
      case 1: {
        this.activeTab = 'worlds';
        break;
      }
    }
  }
}
