import { Component,
         OnInit,
         OnDestroy,
         ViewChild,
         ViewContainerRef,
         ComponentFactoryResolver,
         Type } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { PageNotFoundComponent } from '../page-not-found';

@Component({
  selector: 'ign-asset-display',
  templateUrl: 'asset-display.component.html'
})

/**
 * Component used as the router-outlet endpoint in the routes configuration.
 *
 * Dynamically renders the given component or a PageNotFound component if the data from the route
 * resolver guard failed to be fetched.
 */
export class AssetDisplayComponent implements OnInit, OnDestroy {

  /**
   * The view container of the element that will receive the dynamically generated component.
   */
  @ViewChild('dynamicComponentView', {read: ViewContainerRef})
    private componentViewContainer: ViewContainerRef;

  /**
   * The target component that will be rendered. This comes form the route configuration data or
   * from a 'component' field in the resolvedData.
   */
  private newComponent: Type<any>;

  /**
   * The data that comes from the route resolve guard. If it is null, the PageNotFound component
   * will be displayed.
   */
  private resolvedData: any;

  /**
   * Subscription to the route's data.
   */
  private dataSubscription: Subscription;

  /**
   * @param componentFactoryResolver Factory service used to create new components.
   * @param route The current Activated Route to get associated the data.
   */
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private route: ActivatedRoute) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * Retrieves the data from the current activated route and decides which component to display.
   */
  public ngOnInit(): void {
    this.dataSubscription = this.route.data.subscribe(
      (data) => {
        // Store the corresponding resolved data.
        if (data.resolvedData && data.resolvedData['data']) {
          this.resolvedData = data.resolvedData['data'];
        } else {
          this.resolvedData = data.resolvedData;
        }

        // Set the new component to render.
        if (data.resolvedData !== null) {
          if (data.resolvedData['component']) {
            this.newComponent = data.resolvedData['component'];
          } else {
            this.newComponent = data.component;
          }
        }

        // Note: Components only read the resolvedData so we need to overwrite it.
        data.resolvedData = this.resolvedData;

        // If the new component hasn't been set, it means the PageNotFoundComponent must be
        // rendered.
        if (this.newComponent === undefined) {
          this.newComponent = PageNotFoundComponent;
        }

        this.loadComponent();
      });
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Unsubscribes from the router.
   */
  public ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  /**
   * Creates and loads the required component.
   */
  public loadComponent(): void {
    this.componentViewContainer.clear();
    const factory = this.componentFactoryResolver.resolveComponentFactory(this.newComponent);
    this.componentViewContainer.createComponent(factory);
  }
}
