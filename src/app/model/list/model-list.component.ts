import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private modelService: ModelService) {
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
   * Callback to the onLoadMore event emitted by the Fuel Resource List Component.
   * The Fuel Resource List Component is asking for more resources to be load.
   */
  public loadNextPage(): void {
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
}
