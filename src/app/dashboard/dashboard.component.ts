import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";

import { CollectionService, Collection } from "../collection";
import { Model } from "../model/model";
import { ModelService } from "../model/model.service";
import { WorldService } from "../world/world.service";
import { World } from "../world/world";

/**
 * Represents a single ranked asset in the popular assets list.
 */
interface RankedAsset {
  resource: any;
  type: string;
  score: number;
}

/**
 * Type weight multipliers for the popularity algorithm.
 * Models are weighted highest, then worlds, then collections.
 */
const TYPE_WEIGHTS: Record<string, number> = {
  models: 3,
  worlds: 2,
  collections: 1,
};

@Component({
  selector: "gz-dashboard",
  templateUrl: "dashboard.component.html",
  styleUrls: ["dashboard.component.scss"],
  standalone: false,
})

/**
 * Dashboard Component contains the main landing page.
 */
export class DashboardComponent implements OnInit {
  /**
   * The number of models in the Fuel Server.
   */
  public modelsQuantity: number;

  /**
   * The number of worlds in the Fuel Server.
   */
  public worldsQuantity: number;

  /**
   * The number of collections in the Fuel Server.
   */
  public collectionsQuantity: number;

  /**
   * Search text entered in the hero search bar.
   */
  public searchText: string = "";

  /**
   * The current selected filter (popular, recent, alphabetical).
   */
  public currentFilter: string = "popular";

  /**
   * The displayed list of assets based on the selected filter.
   */
  public displayedAssets: RankedAsset[] = [];

  /**
   * Number of assets to fetch per type for the ranking pool.
   */
  private fetchCount: number = 20;

  /**
   * Number of top assets to display on the dashboard.
   */
  private displayCount: number = 12;

  /**
   * @param collectionService Service to retrieve collections
   * @param modelService Service to retrieve models
   * @param worldService Service to retrieve worlds
   * @param router Router for search navigation
   */
  constructor(
    private collectionService: CollectionService,
    private modelService: ModelService,
    private worldService: WorldService,
    private router: Router,
  ) {}

  /**
   * OnInit lifecycle hook.
   * Fetches the initial data.
   */
  public ngOnInit(): void {
    this.loadAssets();
  }

  /**
   * Change the active filter and reload the assets.
   *
   * @param filter The filter to apply: 'popular', 'recent', or 'alphabetical'.
   */
  public setFilter(filter: string): void {
    if (this.currentFilter !== filter) {
      this.currentFilter = filter;
      this.loadAssets();
    }
  }

  /**
   * Fetches models, worlds, and collections, then sorts them
   * based on the current filter.
   */
  public loadAssets(): void {
    const sortParam =
      this.currentFilter === "popular" ? "most_liked" : undefined;

    forkJoin({
      models: this.modelService.getList({
        per_page: this.fetchCount,
        sort: sortParam,
      }),
      worlds: this.worldService.getList({
        per_page: this.fetchCount,
        sort: sortParam,
      }),
      collections: this.collectionService.getCollectionList({
        per_page: this.fetchCount,
      }),
    }).subscribe({
      next: (results) => {
        // Store total counts for the hero stats
        if (results.models) {
          this.modelsQuantity = results.models.totalCount;
        }
        if (results.worlds) {
          this.worldsQuantity = results.worlds.totalCount;
        }
        if (results.collections) {
          this.collectionsQuantity = results.collections.totalCount;
        }

        const allAssets: RankedAsset[] = [];

        // Models
        if (results.models && results.models.resources) {
          for (const model of results.models.resources) {
            allAssets.push({
              resource: model,
              type: "models",
              score: (model.likes || 0) * TYPE_WEIGHTS["models"],
            });
          }
        }

        // Worlds
        if (results.worlds && results.worlds.resources) {
          for (const world of results.worlds.resources) {
            allAssets.push({
              resource: world,
              type: "worlds",
              score: (world.likes || 0) * TYPE_WEIGHTS["worlds"],
            });
          }
        }

        // Collections
        if (results.collections && results.collections.collections) {
          for (const collection of results.collections.collections) {
            allAssets.push({
              resource: collection,
              type: "collections",
              score: TYPE_WEIGHTS["collections"],
            });
          }
        }

        // Sort based on the active filter
        if (this.currentFilter === "popular") {
          allAssets.sort((a, b) => b.score - a.score);
        } else if (this.currentFilter === "recent") {
          allAssets.sort((a, b) => {
            const dateA = a.resource.modifyDate
              ? new Date(a.resource.modifyDate).getTime()
              : 0;
            const dateB = b.resource.modifyDate
              ? new Date(b.resource.modifyDate).getTime()
              : 0;
            return dateB - dateA;
          });
        } else if (this.currentFilter === "alphabetical") {
          allAssets.sort((a, b) => {
            const nameA = (a.resource.name || "").toLowerCase();
            const nameB = (b.resource.name || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }

        this.displayedAssets = allAssets.slice(0, this.displayCount);
      },
      error: (error) => {
        console.error("Error fetching assets:", error);
      },
    });
  }

  /**
   * Navigate to the models page with the search query.
   */
  public onSearch(): void {
    if (this.searchText && this.searchText.trim().length > 0) {
      this.router.navigate(["/models"], {
        queryParams: { q: this.searchText.trim() },
      });
    }
  }
}
