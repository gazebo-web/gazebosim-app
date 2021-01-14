import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { UserService } from '../user';

@Injectable()

/**
 * The Admin Guard service is a route guard for the /admin route.
 *
 * Prevents navigation based on sysAdmin status.
 */
export class AdminGuard implements CanActivate {

  /**
   * Constructor of the Admin Guard service.
   *
   * @param router Router service to allow navigation.
   * @param deviceService Service used to determine the device type.
   * @param userService Service used to get the user data from the Server.
   */
   constructor(private authService: AuthService,
               private router: Router,
               private userService: UserService) {
  }

  /**
   * Prevents navigation to the /admin route if the user is not a sysAdmin.
   *
   * @returns A boolean or an observable of a boolean indicating whether the
   *          navigation can be achieved or not.
   */
  public canActivate(): Observable<boolean> | boolean {
    // Navigate home if the user does not have permission
    if (!this.authService.isAuthenticated() ||
        !this.authService.userProfile.sysAdmin) {
      this.router.navigate(['']);
      return false;
    }

    // Check with the Server if the user is a system admin.
    return this.userService.getLogin().pipe(
      map((user) => {
        if (user.sysAdmin) {
          return true;
        }
        this.router.navigate(['']);
        return false;
      })
    );
  }
}
