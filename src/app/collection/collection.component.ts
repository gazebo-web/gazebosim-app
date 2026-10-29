import { ActivatedRoute, Router } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Meta } from "@angular/platform-browser";
import { EMPTY, Observable, Subject } from "rxjs";
import { catchError, switchMap, tap } from "rxjs/operators";

import { AuthService } from "../auth/auth.service";
import { Collection } from "./collection";
import { CollectionService } from "./collection.service";
import { ModelService } from "../model/model.service";
import { PaginatedModels } from "../model/paginated-models";
import { PaginatedWorlds } from "../world/paginated-worlds";
import { WorldService } from "../world/world.service";
import { ConfirmationDialogComponent } from "../confirmation-dialog/confirmation-dialog.component";
import { CopyDialogComponent } from "../fuel-resource/copy-dialog/copy-dialog.component";
import { BibtexDialogComponent } from "../model/bibtex-dialog/bibtex-dialog.component";

@Component({
  selector: "gz-collection",
  templateUrl: "collection.component.html",
  styleUrls: ["collection.component.scss"],
  standalone: false,
})

/**
 * Collection Component is the page that display the details of a single collection.
 */
export class CollectionComponent implements OnInit {
  /**
   * The collection represented by this page.
   */
  public collection: Collection;

  /**
   * The paginated models returned from the Server.
   */
  public paginatedModels: PaginatedModels;

  /**
   * The paginated worlds returned from the Server.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * Indicates whether the current user has permission to edit this collection.
   */
  public canEdit: boolean = false;

  /**
   * Number of models/worlds shown per page.
   */
  public readonly RESOURCES_PER_PAGE = 10;

  /**
   * Current page (1-based) of the collection's models.
   */
  public modelPage: number = 1;

  /**
   * Current page (1-based) of the collection's worlds.
   */
  public worldPage: number = 1;

  /**
   * Number of pages of the collection's models.
   */
  public modelPageCount: number = 0;

  /**
   * Number of pages of the collection's worlds.
   */
  public worldPageCount: number = 0;

  /**
   * Pages requested for the collection's models. Only the latest one is loaded.
   */
  private modelPages = new Subject<number>();

  /**
   * Pages requested for the collection's worlds. Only the latest one is loaded.
   */
  private worldPages = new Subject<number>();

  /**
   * The page of models on screen, to go back to if a request fails.
   */
  private shownModelPage: number = 1;

  /**
   * The page of worlds on screen, to go back to if a request fails.
   */
  private shownWorldPage: number = 1;

  /**
   * Download command for this collection.
   */
  public downloadCommand: string;

  /**
   * Confirmation dialog reference used to confirm when a collection is removed.
   */
  private confirmationDialog: MatDialogRef<ConfirmationDialogComponent>;

  /**
   * Dialog to prompt the user about the collection name and owner for copying.
   */
  private copyNameDialog: MatDialogRef<CopyDialogComponent>;

  /**
   * Bibtex for this collection.
   */
  private bibTex: string;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService The Authentication Service to determine the user's permissions
   * @param collectionService Service used to handle collection-related requests to the Server.
   * @param dialog Enables the Material Dialog.
   * @param modelService Service used to fetch the organization's models.
   * @param router The router allows page navigation.
   * @param snackBar Snackbar used to display notifications.
   * @param worldService Service used to fetch the organization's worlds.
   * @param metaService Meta service used to update header tags.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    private collectionService: CollectionService,
    public dialog: MatDialog,
    private modelService: ModelService,
    public router: Router,
    public snackBar: MatSnackBar,
    private worldService: WorldService,
    private metaService: Meta,
  ) {
    // switchMap drops an older request when a newer page is asked for.
    this.modelPages
      .pipe(
        switchMap((page) =>
          this.latestPage(
            this.collectionService.getCollectionModels(
              this.collection.owner,
              this.collection.name,
              { page, per_page: this.RESOURCES_PER_PAGE },
            ),
            () => (this.shownModelPage = page),
            () => (this.modelPage = this.shownModelPage),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.paginatedModels = response;
        this.collection.models = response.resources;
        this.modelPageCount = this.pageCount(response.totalCount);
      });

    this.worldPages
      .pipe(
        switchMap((page) =>
          this.latestPage(
            this.collectionService.getCollectionWorlds(
              this.collection.owner,
              this.collection.name,
              { page, per_page: this.RESOURCES_PER_PAGE },
            ),
            () => (this.shownWorldPage = page),
            () => (this.worldPage = this.shownWorldPage),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.paginatedWorlds = response;
        this.collection.worlds = response.resources;
        this.worldPageCount = this.pageCount(response.totalCount);
      });
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {
    // Retrieve the collection from the activated route's data.
    if (this.activatedRoute.snapshot.data["resolvedData"] !== undefined) {
      this.collection = this.activatedRoute.snapshot.data["resolvedData"];
    }

    // Get the collection's models and worlds (first page).
    this.loadModels();
    this.loadWorlds();

    // Determine whether the logged user can edit this collection.
    // TODO(german-mas): Avoid duplicated code by having a "canEditResource" method in the User
    // Class, and using an Authenticated User.
    // See https://app.asana.com/0/719578238881157/756403371264694/f
    this.canEdit =
      this.authService.isAuthenticated() &&
      (this.collection.owner === this.authService.userProfile.username ||
        this.authService.userProfile["orgs"].includes(this.collection.owner));

    // Create the bibtex
    const date = new Date(this.collection.modifyDate);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    this.bibTex =
      `@online{GazeboFuel-` +
      `${this.collection.owner.split(" ").join("-")}-` +
      `${this.collection.name.split(" ").join("-")},`;
    this.bibTex += `\n\ttitle={${this.collection.name}},`;
    this.bibTex += `\n\torganization={Open Robotics},`;
    this.bibTex += `\n\tdate={${date.getFullYear()}},`;
    this.bibTex += `\n\tmonth={${monthNames[date.getMonth()]}},`;
    this.bibTex += `\n\tday={${date.getDay()}},`;
    this.bibTex += `\n\tauthor={${this.collection.owner}},`;
    this.bibTex += `\n\turl={${this.collectionService.baseUrl + this.router.url}},\n}`;

    this.downloadCommand =
      'python3 download_collection.py -o "' +
      this.collection.owner +
      '" -c "' +
      this.collection.name +
      '"';

    // The collections's description, used to set meta tags.
    const description =
      this.collection.description !== undefined &&
      this.collection.description !== ""
        ? this.collection.description
        : "A collection on the Gazebo App.";

    // Update header meta data. This assumes that index.html has been
    // populated with default values for each of the tags. If you add new tags,
    // then also add a default value to src/index.html
    this.metaService.updateTag({
      name: "og:title",
      content: this.collection.name,
    });
    this.metaService.updateTag({
      name: "og:description",
      content: description,
    });
    this.metaService.updateTag({
      name: "og:url",
      content: this.collectionService.baseUrl + this.router.url,
    });
    this.metaService.updateTag({
      name: "twitter:card",
      content: "summary_large_image",
    });
    this.metaService.updateTag({
      name: "twitter:title",
      content: this.collection.name,
    });
    this.metaService.updateTag({
      name: "twitter:description",
      content: description,
    });
    this.metaService.updateTag({
      name: "twitter:image:alt",
      content: this.collection.name,
    });
    if (this.collection.thumbnails.length > 0) {
      this.metaService.updateTag({
        name: "og:image",
        content: this.collection.thumbnails[0].url,
      });
      this.metaService.updateTag({
        name: "twitter:image",
        content: this.collection.thumbnails[0].url,
      });
    }
  }

  /**
   * Remove collection.
   */
  public removeCollection(): void {
    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Delete collection ${this.collection.name}`,
        message: `<p>Are you sure you want to remove this collection?</p>\
                 <p>Assets that belong to this collection won't be affected.</p>\
                 <p><strong>Once deleted, the collection can't be restored.</strong></p>`,
        buttonText: "Delete",
      },
    };

    this.confirmationDialog = this.dialog.open(
      ConfirmationDialogComponent,
      dialogOps,
    );

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed().subscribe((result) => {
      if (result !== true) {
        return;
      }

      // Request deletion.
      this.collectionService
        .deleteCollection(this.collection.owner, this.collection.name)
        .subscribe(
          (response) => {
            this.snackBar.open(
              `${this.collection.name} was removed`,
              "Got it",
              {
                duration: 2750,
              },
            );
            this.router.navigate([this.collection.owner + "/collections"]);
          },
          (error) => {
            this.snackBar.open(`${error.message}`, "Got it");
          },
        );
    });
  }

  /**
   * Computes the number of pages for a given total count.
   *
   * @param totalCount The total number of resources.
   * @returns The number of pages.
   */
  private pageCount(totalCount: number): number {
    return Math.ceil((totalCount || 0) / this.RESOURCES_PER_PAGE);
  }

  /**
   * Loads a page of the collection's models.
   *
   * @param page The 1-based page number to load.
   */
  public loadModels(page: number = 1): void {
    // Move the pager now, so fast clicks add up.
    // DEVNOTE: This change is not reflected in the Client URL.
    this.modelPage = page;
    this.modelPages.next(page);
  }

  /**
   * Loads a page of the collection's worlds.
   *
   * @param page The 1-based page number to load.
   */
  public loadWorlds(page: number = 1): void {
    // Move the pager now, so fast clicks add up.
    // DEVNOTE: This change is not reflected in the Client URL.
    this.worldPage = page;
    this.worldPages.next(page);
  }

  /**
   * Wraps a page request: records the page once it loads, and on failure
   * moves the pager back and shows the error, so the page stream keeps going.
   *
   * @param request The request for a page.
   * @param loaded Called when the page has loaded.
   * @param failed Called when the request fails, to move the pager back.
   */
  private latestPage<T>(
    request: Observable<T>,
    loaded: () => void,
    failed: () => void,
  ): Observable<T> {
    return request.pipe(
      tap(loaded),
      catchError((error) => {
        failed();
        this.snackBar.open(error.message, "Got it");
        return EMPTY;
      }),
    );
  }

  /**
   * Event callback to remove a resource from the Collection.
   *
   * @param event The event containing the resource to remove.
   */
  public removeItem(event): void {
    const resource = event.resource;

    // Fire the confirmation dialog.
    const dialogOps = {
      data: {
        title: `Remove ${resource.name} from Collection`,
        message: `<p>Are you sure you want to remove ${resource.name} from this collection?</p>\
                  <p>Keep in mind this won't delete the resource, only remove it from the\
                  <strong>${this.collection.name}</strong> collection.</p>`,
        buttonText: "Remove",
      },
    };

    this.confirmationDialog = this.dialog.open(
      ConfirmationDialogComponent,
      dialogOps,
    );

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed().subscribe((result) => {
      if (result !== true) {
        return;
      }

      // Request deletion.
      this.collectionService
        .removeAsset(this.collection.owner, this.collection.name, resource)
        .subscribe(
          (response) => {
            // Reload the page so it refills, or step back if it is now past the end.
            if (event.type === "models") {
              const lastPage = this.pageCount(
                this.paginatedModels.totalCount - 1,
              );
              this.loadModels(Math.max(1, Math.min(this.modelPage, lastPage)));
            }
            if (event.type === "worlds") {
              const lastPage = this.pageCount(
                this.paginatedWorlds.totalCount - 1,
              );
              this.loadWorlds(Math.max(1, Math.min(this.worldPage, lastPage)));
            }

            this.snackBar.open(
              `${resource.name} was removed from ${this.collection.name}`,
              "Got it",
              { duration: 2750 },
            );
          },
          (error) => {
            this.snackBar.open(`${error.message}`, "Got it");
          },
        );
    });
  }

  /**
   * Callback when enter key is pressed on search input.
   *
   * @param search Search string.
   */
  public onSearch(search: string): void {
    let searchFinal = "collections:" + this.collection.name;

    // Replace ampersand with %26 so that it gets sent over the wire
    // correctly.
    // todo: Consider supporting form search, instead of only a single "?q"
    // parameter.
    if (search !== null && search !== undefined && search !== "") {
      searchFinal += "&" + search;
    }

    // Get the searched models.
    this.modelService.getList({ search: searchFinal }).subscribe(
      (models) => {
        if (models !== undefined) {
          this.paginatedModels = models;
          this.collection.models = models.resources;
          this.modelPage = 1;
          this.modelPageCount = this.pageCount(models.totalCount);
        }
      },
      (error) => {
        console.error("Error searching models", error);
        this.snackBar.open(error.message, "Got it");
      },
    );

    // Get the searched worlds.
    this.worldService.getList({ search: searchFinal }).subscribe(
      (worlds) => {
        if (worlds !== undefined) {
          this.paginatedWorlds = worlds;
          this.collection.worlds = worlds.resources;
          this.worldPage = 1;
          this.worldPageCount = this.pageCount(worlds.totalCount);
        }
      },
      (error) => {
        console.error("Error searching worlds", error);
        this.snackBar.open(error.message, "Got it");
      },
    );
  }

  /**
   * Opens a dialog showing the BibTeX citation for this collection.
   */
  public openBibtex(): void {
    this.dialog.open(BibtexDialogComponent, {
      data: { bibtex: this.bibTex },
      autoFocus: false,
    });
  }

  /**
   * Callback for the download command copy button. Copies the download
   * command to the clipboard.
   */
  public copyDownloadCommand(): void {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = this.downloadCommand;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    this.snackBar.open("Command copied to clipboard.", "", {
      duration: 2000,
    });
  }

  /**
   * Title of the Copy Button.
   *
   * @returns The title of the copy button, whether the collection can be copied or not.
   */
  public getCopyButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return "Log in to copy this collection";
    }
    return "Copy this collection";
  }

  /**
   * Callback for the Collection Copy button.
   */
  public copyCollection(): void {
    const dialogOps = {
      disableClose: true,
      data: {
        title: "Copy collection",
        message: `<p>Add a copy of the collection to your account or into an organization.</p>
          <p>Please enter a new name and owner for the copied collection.</p>`,
        name: this.collection.name,
        namePlaceholder: "Collection name",
        owner: this.authService.userProfile.username,
        ownerList: [
          this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort(),
        ],
        busyMessage: `<p>Copying the collection into the account.</p>`,
      },
    };

    this.copyNameDialog = this.dialog.open(CopyDialogComponent, dialogOps);

    // Subscribe to the dialog's submit method.
    this.copyNameDialog.componentInstance.onSubmit.subscribe((result) => {
      if (result !== undefined && result.copyName.trim() !== "") {
        this.copyNameDialog.componentInstance.busy = true;
        this.collectionService
          .copy(this.collection, result.copyName.trim(), result.copyOwner)
          .subscribe(
            (response) => {
              this.copyNameDialog.close();

              this.snackBar.open(`${response.name} was created`, "Got it", {
                duration: 2750,
              });
              this.router.navigate([
                `/${response.owner}/collections/${response.name}`,
              ]);
            },
            (error) => {
              this.snackBar.open(error.message, "Got it");
            },
          );
      } else {
        this.copyNameDialog.componentInstance.busy = false;
      }
    });
  }
}
