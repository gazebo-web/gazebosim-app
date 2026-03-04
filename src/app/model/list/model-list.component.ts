import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PageEvent } from "@angular/material/paginator";

import { Model } from "../model";
import { ModelService } from "../model.service";
import { PaginatedModels } from "../paginated-models";

@Component({
  selector: "gz-models",
  templateUrl: "model-list.component.html",
  styleUrls: ["model-list.component.scss"],
  standalone: false,
})

/**
 * Model List Component is a page that displays a list of models.
 */
export class ModelListComponent implements OnInit {
  /**
   * The array of Models this component represents.
   */
  public models: Model[];

  /**
   * The paginated Models returned from the Server.
   */
  public paginatedModels: PaginatedModels;

  /**
   * This component can display different kinds of lists depending on the route.
   * The title to display comes from the activated route's data.
   */
  public title: string;

  /**
   * The current filter being used.
   */
  public currentFilter: string = "most_liked";

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param modelService Service used to get the paginated Models.
   * @param router The router used to call navigation methods.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private modelService: ModelService,
    private router: Router,
  ) {}

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of models obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    // Take the resources from the resolved data.
    this.paginatedModels = this.activatedRoute.snapshot.data["resolvedData"];
    this.models = this.paginatedModels.resources;

    // Evaluates the initial filter from the route's query params.
    if (this.activatedRoute.snapshot.queryParams["sort"]) {
      this.currentFilter = this.activatedRoute.snapshot.queryParams["sort"];
    } else if (!this.activatedRoute.snapshot.queryParams["q"]) {
      this.currentFilter = "most_liked";
    } else {
      this.currentFilter = "";
    }

    // Sort models locally as a fallback for backend sorting.
    this.sortModels();

    // Evaluates the route's title.
    this.title = this.activatedRoute.snapshot.data["title"](
      this.activatedRoute,
    );
  }

  /**
   * Get new models when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
  public getModels(event: PageEvent) {
    const params = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };
    if (this.currentFilter) {
      params["sort"] = this.currentFilter;
    }

    this.modelService.getList(params).subscribe((models) => {
      this.paginatedModels = models;
      this.models = this.paginatedModels.resources;

      // Sort models locally as a fallback for backend sorting.
      this.sortModels();

      // Navigate to the Model List page.
      // Note that this does not recreate the component, since the navigation is to the same page.
      let url = `/models?page=${event.pageIndex + 1}&per_page=${event.pageSize}`;
      if (this.currentFilter) {
        url += `&sort=${this.currentFilter}`;
      }
      this.router.navigateByUrl(url);
    });
  }

  /**
   * Called when a filter is selected.
   *
   * @param event The mouse event from the button click.
   * @param filter The filter to set.
   */
  public setFilter(event: MouseEvent, filter: string): void {
    event.stopPropagation();
    this.currentFilter = filter;
    this.getModels({
      pageIndex: 0,
      pageSize: 12,
      length: this.paginatedModels.totalCount,
    } as PageEvent);
  }

  /**
   * Sorts the current list of models based on the current filter.
   */
  private sortModels(): void {
    if (!this.models || !this.currentFilter) {
      return;
    }

    if (this.currentFilter === "most_liked") {
      this.models.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (this.currentFilter === "recent") {
      this.models.sort((a, b) => {
        const dateA = a.modifyDate ? new Date(a.modifyDate).getTime() : 0;
        const dateB = b.modifyDate ? new Date(b.modifyDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (this.currentFilter === "name") {
      this.models.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
  }
}
