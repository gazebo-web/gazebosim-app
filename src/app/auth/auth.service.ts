import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import * as auth0 from 'auth0-js';
import { environment } from '../../environments/environment';

import { AUTH_CONFIG } from './auth0-variables';
import { FuelResource } from '../fuel-resource';

@Injectable({
  providedIn: 'root',
})

/**
 * This service provides login and logout capabilities throughout Auth0.
 *
 * Authentication flow:
 *
 * 1. Click on the avatar at the right side of the app bar. Click the "Log In" option.
 * 2. Auth0 login widget pops up.
 * 3. User enters credentials.
 * 4. Auth0 trigger the redirectUri (e.g. http://localhost/callback). See app.routes.ts for the
 *    callback route information.
 * 5. The callback.component.ts is instantiated, and the user is validated.
 * 6. If this is a new user (first time login), they will be prompted to
 *    create an account, otherwise they are taken to /home.
 */
export class AuthService {
  /**
   * Logged in status.
   */
  public loggedIn: boolean = false;

  /**
   * Logged in status stream to communicate throughout the app.
   */
  public loggedIn$ = new BehaviorSubject<boolean>(this.loggedIn);

  /**
   * User profile.
   */
  public userProfile: any;

  /**
   * Profile stream to communicate throughout the app.
   */
  public userProfile$ = new BehaviorSubject<any>(null);

  /**
   * Subscriber for the token renewal process.
   */
  public tokenRenewalSub: Subscription;

  /**
   * URL used to log in and retrieve the username.
   */
  private loginUrl: string = `${environment.API_HOST}/${environment.API_VERSION}/login`;

  /**
   * Auth0 Web Auth instance.
   */
  private auth0 = new auth0.WebAuth({
    clientID: AUTH_CONFIG.CLIENT_ID,
    domain: AUTH_CONFIG.CLIENT_DOMAIN,
    responseType: 'token id_token',
    audience: AUTH_CONFIG.AUDIENCE,
    redirectUri: AUTH_CONFIG.REDIRECT,
    scope: AUTH_CONFIG.SCOPE
  });

  /**
   * @param http Performs HTTP requests.
   * @param router Router to navigate to other URLs
   */
  constructor(
    private http: HttpClient,
    private router: Router) {

    // If authenticated, update login status subject.
    if (this.isAuthenticated()) {
      this.setLoggedIn(true);
    } else {
      // The user is not authenticated.
      // Check if there is an access token in the local storage.
      const token = localStorage.getItem('token');
      if (token) {
        if (this.isTokenValid) {
          // We need to fetch the username and then reschedule the token renewal process.
          this.fetchUsername();
          this.scheduleRenewal();
        } else {
          // The token has expired, but we can try to renew it.
          this.renewToken();
        }
      }
    }
  }

  /**
   * Set the user profile.
   *
   * This will trigger the userProfile$ behavior subject.
   *
   * @param profile The user profile to set.
   */
  public setProfile(profile: any): void {
    // Update user profile subject
    this.userProfile$.next(profile);
    this.userProfile = profile;
  }

  /**
   * Log in.
   */
  public login(): void {
    // Auth0 authorize request
    // Note: nonce is automatically generated:
    // https://auth0.com/docs/libraries/auth0js/v9#using-nonces
    this.auth0.authorize({
      prompt: 'login',
    });
  }

  /**
   * Log out.
   *
   * Performs cleanup tasks, such as disabling the logged in status, cleaning the local storage and
   * navigating to the home page.
   */
  public logout(): void {
    // Remove session-related items from the local storage.
    localStorage.removeItem('token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('profile');
    localStorage.removeItem('expires_at');

    // Reset profile.
    this.setProfile(undefined);

    // Update Log In status subject.
    this.setLoggedIn(false);

    // Logout from Auth0.
    this.auth0.logout({
      client_id: AUTH_CONFIG.CLIENT_ID,
      returnTo: environment.AUTH0_LOGOUT_REDIRECT,
    });
  }

  /**
   * Handle Authentication.
   *
   * Obtains the results from the authentication and sets the session, if the authentication went
   * correctly. After this, navigates to the given callback url.
   */
  public handleAuth(): void {
    // When Auth0 hash parsed, get profile.
    this.auth0.parseHash((err, authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        window.location.hash = '';

        // Use access token to retrieve user's profile and set session
        this.auth0.client.userInfo(authResult.accessToken, (error, profile) => {
          if (profile) {
            this.setSession(authResult, profile);
          } else if (error) {
            console.error(`Error authenticating: ${error.error}`);
          }
        });

      } else if (err) {
        if (err.error === 'unauthorized' && err.errorDescription === 'Please verify your email.') {
          this.router.navigate(['/callback'], {queryParams: {validate: true}});
        } else {
          this.router.navigate(['/']);
        }
        console.error(`Error: ${err.error}: ${err.errorDescription}`);
      }
    });
  }

  /**
   * Check if there is an authenticated user.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  public isAuthenticated(): boolean {
    // Check if there's an unexpired access token.
    if ((localStorage.getItem('token') == null) || (!this.isTokenValid)) {
      return false;
    }

    // Make sure the user profile has been set
    if (!this.userProfile) {
      this.setProfile(JSON.parse(localStorage.getItem('profile')));
    }

    // Check if user has username
    return this.userProfile && this.userProfile['username'];
  }

  /**
   * Check if the token is valid.
   *
   * @returns A boolean whether the token is valid or not.
   */
  public get isTokenValid(): boolean {
    // Check if current time is past access token's expiration.
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return Date.now() < expiresAt;
  }

  /**
   * Schedule the token renewal.
   */
  public scheduleRenewal(): void {
    // If user isn't authenticated, do nothing.
    if (!this.isTokenValid || !this.isAuthenticated) {
      return;
    }

    // Unsubscribe from previous expiration observable.
    this.unscheduleRenewal();

    // Get the expiration time and set an expiration Observable.
    const expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    const expiresIn$ = of(expiresAt).pipe(
      mergeMap((expires) => {
        const now = Date.now();
        // Emit the observable at the timer's duration.
        return timer(Math.max(1, expires - now));
      })
    );

    // Subscribe to the token expiration observable. The token needs to be refreshed.
    this.tokenRenewalSub = expiresIn$.subscribe(
      () => {
        const token = localStorage.getItem('token');
        if (token) {
          this.renewToken();
          this.scheduleRenewal();
        }
      });
  }

  /**
   * Return whether the authenticated user is an owner of a given organization.
   * TODO(german-mas): Consider moving this method into a an AuthenticatedUser class.
   * See https://app.asana.com/0/719578238881157/756403371264694/f
   *
   * @param org The organization name used to check permissions.
   * @returns A boolean indicating whether the authenticated user is an owner or not.
   */
  public isOwner(org: string): boolean {
    return this.isAuthenticated() && this.userProfile.orgRoles[org] === 'owner';
  }

  /**
   * Return whether the authenticated user has write access to a given organization.
   * TODO(german-mas): Consider moving this method into a an AuthenticatedUser class.
   * See https://app.asana.com/0/719578238881157/756403371264694/f
   *
   * @param org The organization name used to check permissions.
   * @returns A boolean indicating whether the authenticated user has write access or not.
   */
  public hasWriteAccess(org: string): boolean {
    return this.isAuthenticated() &&
      (this.userProfile.orgRoles[org] === 'owner' || this.userProfile.orgRoles[org] === 'admin');
  }

  /**
   * Return whether the authenticated user can edit a given Fuel resource.
   *
   * Users have write access to a resource if:
   * - They are the owner.
   * - Is from an Organization they belong to, whether the resource is public or private.
   *
   * TODO(german-mas): Consider moving this method into a an AuthenticatedUser class.
   * See https://app.asana.com/0/719578238881157/756403371264694/f
   *
   * @param resource The Fuel resource to check permissions.
   * @returns A boolean indicating whether the authenticated user has write access or not.
   */
  public canWriteResource(resource: FuelResource): boolean {
    const belongsToOrg = this.userProfile && this.userProfile['orgs'] &&
      this.userProfile['orgs'].includes(resource.owner);

    return this.isAuthenticated() &&
      (resource.owner === this.userProfile.username) || (belongsToOrg);
  }

  /**
   * Unsubscribes from the token renewal schedule.
   */
  public unscheduleRenewal(): void {
    if (this.tokenRenewalSub) {
      this.tokenRenewalSub.unsubscribe();
    }
  }

  /**
   * Set the current session based on a Auth0 login.
   *
   * @param authResult The result of the authentication.
   * @param profile The resulting profile from the authentication.
   */
  private setSession(authResult, profile): void {
    // Retrieve the expiration date of the access token from authResult.
    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + Date.now());

    // Save session data and update login status subject.
    localStorage.setItem('token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('profile', JSON.stringify(profile));

    // Set the obtained profile. Fetch the username if necessary.
    if (!profile.username) {
      this.fetchUsername();
    } else {
      this.updateProfile();
    }

    // Update the login status stream.
    this.setLoggedIn(true);

    // Schedule token renewal.
    this.scheduleRenewal();
  }

  /**
   * Set the logged in status.
   *
   * @param value True to indicate that someone is logged in.
   */
  private setLoggedIn(value: boolean): void {
    // Update login status subject.
    this.loggedIn$.next(value);
    this.loggedIn = value;
    if (this.loggedIn) {
      this.updateProfile();
    }
  }

  /**
   * Renews the token if the session is still open.
   */
  private renewToken(): void {
    this.auth0.checkSession({},
      (err, authResult) => {
        if (authResult && authResult.accessToken) {
          // Use access token to retrieve user's profile and set session
          this.auth0.client.userInfo(authResult.accessToken, (error, profile) => {
            if (profile) {
              this.setSession(authResult, profile);
            } else if (error) {
              this.router.navigate(['/']);
              console.error(`Error authenticating: ${error.error}`);
            }
          });
        } else {
          // Auth0 error. Token can't be renewed, likely because the Auth0 session expired.
          // This happens after 7 days of inactivity.
          this.logout();
          console.error(err);
        }
      });
  }

  /**
   * Update the user profile. This will get user info from Auth0.
   */
  private updateProfile(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Use the stored profile, otherwise, get it from the Token.
    this.userProfile = JSON.parse(localStorage.getItem('profile'));
    if (!this.userProfile) {
      this.auth0.client.userInfo(token, (err, profile) => {
        if (profile) {
          this.userProfile = profile;
        }
      });
    } else {
      this.setProfile(this.userProfile);
    }
  }

  /**
   * Fetch the username by making a GET request to /login.
   *
   * When the token is renewed, a new profile is obtained. This profile does not contain the
   * username. This way, we can make sure the user is still authenticated with a renewed token.
   */
  private fetchUsername(): void {
    this.http.get(this.loginUrl).subscribe(
      (response) => {
        if (response['username']) {
          // Set the username and orgs to the profile.
          const profile = JSON.parse(localStorage.getItem('profile'));
          profile.username = response['username'];
          profile.orgs = response['orgs'];
          profile.orgRoles = response['orgRoles'];
          if (response['sysAdmin']) {
            profile.sysAdmin = response['sysAdmin'];
          }
          localStorage.setItem('profile', JSON.stringify(profile));

          // Updates the Profile.
          this.userProfile = profile;
        }
      });
  }
}
