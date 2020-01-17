import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import { Ng2DeviceService } from '../../device-detector';

@Injectable()

/**
 * The New World Guard service is a route guard for the worlds/upload route.
 *
 * Prevents navigation on mobile devices.
 */
export class NewWorldGuard implements CanActivate {

  /**
   * Constructor of the New World Guard service.
   *
   * @param router Router service to allow navigation.
   * @param deviceService Service used to determine the device type.
   */
  constructor(private router: Router,
              private deviceService: Ng2DeviceService) {
  }

  /**
   * Prevents the navigation to the Upload route if the device is a mobile.
   *
   * @returns A boolean indicating whether the navigation can be achieved or not.
   */
  public canActivate(): boolean {
    if (!this.deviceService.isDesktop()) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
