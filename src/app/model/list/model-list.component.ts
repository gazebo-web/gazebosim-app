import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

import { Model } from '../model';
import { ModelService } from '../model.service';
import { PaginatedModels } from '../paginated-models';

@Component({
  selector: 'gz-models',
  templateUrl: 'model-list.component.html',
  styleUrls: ['model-list.component.scss']
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
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param modelService Service used to get the paginated Models.
   * @param router The router used to call navigation methods.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private modelService: ModelService,
    private router: Router) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of models obtained from the Route Resolver.
   */
  public ngOnInit(): void {

    // Take the resources from the resolved data.
    this.paginatedModels = this.activatedRoute.snapshot.data['resolvedData'];
    this.models = this.paginatedModels.resources;

    // Evaluates the route's title.
    this.title = this.activatedRoute.snapshot.data['title'](this.activatedRoute);
  }

  /**
   * Get new models when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
  public getModels(event: PageEvent) {
    this.modelService.getList({
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    }).subscribe(
      (models) => {
        this.paginatedModels = models;
        this.models = this.paginatedModels.resources;

        // Navigate to the Model List page.
        // Note that this does not recreate the component, since the navigation is to the same page.
        this.router.navigateByUrl(`/models?page=${event.pageIndex+1}&per_page=${event.pageSize}`);
      }
    );
  }
}
