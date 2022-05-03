import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()

/**
 * PortalRedirectGuard is used to prevent the navigation into a particular Portal.
 * This way, we can smoothly redirect the navigation into the portal's website.
 */
export class PortalRedirectGuard implements CanActivate {

  /**
   * Implementation of the CanActivate interface.
   *
   * @returns A boolean indicating whether the navigation can be achieved or not.
   */
  public canActivate(route: ActivatedRouteSnapshot): boolean {
    window.location.href = "https://app.gazebosim.org";
    return true;
  }
}
