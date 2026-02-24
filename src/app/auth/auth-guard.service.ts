import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

/**
 * AuthGuard is a CanActivate guard used to prevent navigation to a route, if the user
 * is not authenticated.
 */
export class AuthGuard implements CanActivate {

  /**
   * @param auth Service used to get authentication information.
   * @param router Router service to allow navigation.
   */
  constructor(
    private auth: AuthService,
    private router: Router) {
  }

  /**
   * Implementation of the CanActivate interface.
   *
   * @returns A boolean indicating whether the navigation can be achieved or not.
   */
  public canActivate(): boolean {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
