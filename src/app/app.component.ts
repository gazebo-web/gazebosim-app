import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router,
         ActivatedRoute,
         Event,
         ResolveStart,
         ResolveEnd,
         NavigationEnd,
         NavigationCancel } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { MediaChange, MediaObserver } from '@angular/flex-layout';

import { SearchComponent } from './search';
import { AuthService } from './auth/auth.service';
import { Ng2DeviceService } from './device-detector';


@Component({
  selector: 'gz-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

/**
 * App Component is the main component and entry point of the Web Application.
 */
export class AppComponent implements OnInit {

  /**
   * The sidenav element. Used to control it's behavior from the component.
   */
  @ViewChild('sidenav') public sidenav: MatSidenav;

  /**
   * Search element.
   */
  @ViewChild('search') public searchBar: ElementRef;

  /**
   * Title of the Web Application.
   */
  public readonly title = 'Gazebo';

  /**
   * Current year to display in the copyright.
   */
  public currentYear: number = new Date().getFullYear();

  /**
   * Indicates whether a route is being resolved or not.
   */
  public resolvingRoute: boolean = false;

  /**
   * Current value of the Progress Bar.
   */
  public progressBarValue: number;

  /**
   * Main title in the titlebar.
   */
  public titlebarTitle: string;

  /**
   * Subtitle in the titlebar.
   */
  public titlebarSubtitle: string;

  /**
   * @param authService The Authentication Service.
   * @param deviceService Service used to determine the browser's user agent.
   * @param dialog Allows opening dialogs. Used to open the Settings dialog.
   * @param media Allows detecting width changes on the media. Used to handle the sidenav behavior.
   * @param route The current Activated Route.
   * @param router The router used. Allows subscription to events.
   * @param snackBar The snackbar used for notification.
   * @param titleService Service used to modify the browser's title.
   */
  constructor(
    public authService: AuthService,
    public deviceService: Ng2DeviceService,
    public dialog: MatDialog,
    public media: MediaObserver,
    private route: ActivatedRoute,
    private router: Router,
    public snackBar: MatSnackBar,
    private titleService: Title) {
    this.authService.handleAuth();
  }

  /**
   * OnInit lifecycle hook.
   *
   * Subscribes to route events, in order to display the progress bar and the Browser title, and
   * to media events in order to control the behavior of the sidenav.
   */
  public ngOnInit(): void {
    // Subscribe to media changes. Detects the change in a layout breakpoint.
    this.media.asObservable().subscribe((changes: MediaChange[]) => {
      if (changes.some(change => change.mqAlias === 'xs')) {
        if (this.sidenav.mode === 'side') {
          this.sidenav.mode = 'over';
          this.sidenav.close();
        }
      } else {
        if (this.sidenav.mode === 'over') {
          this.sidenav.mode = 'side';
          this.sidenav.open();
        }
      }
    });

    // Subscribe to router events.
    this.router.events.subscribe(
      (event) => {
        if (event instanceof ResolveStart) {
          this.progressBarValue = 0;
          this.resolvingRoute = true;
          this.makeProgress();
        }
        if (event instanceof ResolveEnd ||
            event instanceof NavigationCancel) {
          this.progressBarValue = 100;
          this.resolvingRoute = false;
        }
        if (event instanceof NavigationEnd) {
          let currentRoute = this.route.root;
          while (currentRoute.children[0] !== undefined) {
            currentRoute = currentRoute.children[0];
          }

          // Dismisses any indefinite snackbar (duration of 0).
          const openedSnackbar = this.snackBar._openedSnackBarRef;
          if (openedSnackbar &&
              openedSnackbar.containerInstance &&
              openedSnackbar.containerInstance.snackBarConfig.duration === 0) {
            this.snackBar.dismiss();
          }

          // Navigate to the top.
          window.scrollTo(0, 0);

          // The title can be either a string or a function, which requires the current route as
          // its argument.
          let title = '';
          if (typeof(currentRoute.snapshot.data.title) === 'function') {
            title = currentRoute.snapshot.data.title(currentRoute);
          } else {
            title = currentRoute.snapshot.data.title;
          }

          // Set the title in the titlebar
          if (currentRoute.snapshot.data.titlebarTitle !== undefined) {
            this.titlebarTitle = currentRoute.snapshot.data.titlebarTitle;
          } else {
            this.titlebarTitle = '';
          }

          // Set the subtitle in the titlebar
          if (currentRoute.snapshot.data.titlebarSubtitle !== undefined) {
            this.titlebarSubtitle = currentRoute.snapshot.data.titlebarSubtitle;
          } else {
            this.titlebarSubtitle = '';
          }

          // Set the Browser's title.
          if (title) {
            this.titleService.setTitle(`${this.title} - ${title}`);
          } else {
            this.titleService.setTitle(this.title);
          }
        }
      });
  }

  /**
   * Close the sidenav, only if it's on 'Over' mode, which means that the viewport width is
   * less than 600px wide.
   */
  public closeSidenav(): void {
    if (this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }

  /**
   * Callback when enter key is pressed on search input.
   *
   * @param search Search string.
   */
  public onSearch(search: string): void {
    this.router.navigate(['search', {q: search}]);
  }

  /**
   * On deactivate event handler.
   */
  public onDeactivate(event): void {
    // Clear the search text
    if (event instanceof SearchComponent) {
      this.searchBar.nativeElement.value = '';
    }
  }

  /**
   * Raise the Progress Bar's value.
   *
   * Completes 5% of progress every 200ms. If the progress is at 90%, it completes the missing half.
   */
  private makeProgress(): void {
    setTimeout(() => {
      if (this.resolvingRoute) {
        if (this.progressBarValue < 90) {
          this.progressBarValue += 5;
        } else {
          this.progressBarValue += (100 - this.progressBarValue) / 2;
        }
        this.makeProgress();
      }
    }, 200);
  }
}
