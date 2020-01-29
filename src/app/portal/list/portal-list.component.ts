import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Portal, PortalService } from '../../portal';

@Component({
  selector: 'ign-portal-list',
  templateUrl: 'portal-list.component.html',
  styleUrls: ['portal-list.component.scss']
})

/**
 * Portal List Component is a page that displays a list of available portals.
 */
export class PortalListComponent implements OnInit {

  /**
   * The array of portals this component represents.
   */
  public portals: Portal[];

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param portalService Service used to get portals.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private portalService: PortalService) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of portals obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    // Take the resources from the resolved data.
    this.portals = this.activatedRoute.snapshot.data['resolvedData'];
  }
}
