import { Component, OnInit, OnDestroy, SecurityContext, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Meta, DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subscription, forkJoin } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { Collection, CollectionService, PaginatedCollection } from '../collection';
import { CollectionDialogComponent } from '../collection/dialog/collection-dialog.component';
import { CopyDialogComponent } from '../fuel-resource/copy-dialog/copy-dialog.component';
import { ReportDialogComponent } from '../fuel-resource/report-dialog/report-dialog.component';
import { World } from './world';
import { WorldService } from './world.service';
import { SdfViewerComponent } from '../model/sdfviewer/sdfviewer.component';
import * as FileSaver from 'file-saver';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'gz-world',
  templateUrl: 'world.component.html',
  styleUrls: ['world.component.scss']
})

/**
 * World Component is the page that display the details of a single world.
 *
 * TODO(german.e.mas) Refactor common code between Model and World component.
 * See https://app.asana.com/0/851925973517080/899265102507497/f
 */
export class WorldComponent implements OnInit, OnDestroy {

  /**
   * The world represented by this Component. It is fetched using a Route Resolver.
   */
  public world: World;

  /**
   * Indicates whether the current user has permission to edit this world
   */
  public canEdit: boolean = false;

  /**
   * The images to be displayed in the gallery.
   */
  public galleryImages: SafeUrl[];

  /**
   * Disable the like button. This helps to prevent multiple calls.
   */
  public disableLike: boolean = false;

  /**
   * Number of the latest version for this world.
   */
  public latestVersion: number;

  /**
   * Number of the current version being displayed.
   */
  public currentVersion: number;

  /**
   * List of collections that have this world.
   */
  public collections: Collection[];

  /**
   * The paginated Collections returned from the Server, required by the resource list component.
   */
  public paginatedCollections: PaginatedCollection;

  /**
   * Subscription to the Collection Dialog. Used to see the result of it.
   */
  public collectionDialogSubscription: Subscription;

  /**
   * Bibtex for this world.
   */
  public bibTex: string;

  /**
   * GzWeb visualizer flag.
   */
  public hasGzWeb: boolean;

  /**
   * Dialog to prompt the user about the World name for copying.
   */
  private copyNameDialog: MatDialogRef<CopyDialogComponent>;

  /**
   * Dialog to add the world into a collection (or create one).
   */
  private collectionDialog: MatDialogRef<CollectionDialogComponent>;

  /**
   * Dialog to report a world
   */
  private reportWorldDialog: MatDialogRef<ReportDialogComponent>;

  /**
   * Are we rendering sdfviewer scene.
   */
  private view3d: boolean;

  /**
   * Reference to the <div> that can be toggled fullscreen.
   */
  @ViewChild('fullScreen') private divRef;

  /**
   * Reference to the <gz-sdfviewer>.
   */
  @ViewChild(SdfViewerComponent) private sdfViewer: SdfViewerComponent;

  /**
   * @param activatedRoute The current Activated Route to get associated the data
   * @param authService Service to get authentication details
   * @param collectionsService Service used to get related collections from the Server
   * @param dialog Dialog to prompt the user for an input
   * @param location Helps changing the URL without redirecting
   * @param worldService Service used to get World information from the Server
   * @param router Router service to allow navigation
   * @param snackBar Snackbar used to display notifications
   * @param metaService Meta service used to update header tags.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    public collectionService: CollectionService,
    public dialog: MatDialog,
    private location: Location,
    private worldService: WorldService,
    private router: Router,
    public snackBar: MatSnackBar,
    private metaService: Meta,
    private sanitizer: DomSanitizer) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the world obtained from the Route Resolver, and gets its URL and files.
   */
  public ngOnInit(): void {
    // Check if the browser supports WebGL.
    const canvas = document.createElement('canvas');
    this.hasGzWeb = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.world = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Latest version
    if (this.world !== undefined && this.world.versions !== undefined) {
      this.latestVersion = this.world.versions[this.world.versions.length - 1];
    } else {
      this.latestVersion = 1;
    }

    // Current version
    const version = this.activatedRoute.snapshot.paramMap.get('version');

    if (version === null || version === 'tip') {
      this.currentVersion = this.latestVersion;
    } else {
      this.currentVersion = +version;
    }

    this.getFiles();

    this.loadCollections();

    this.canEdit = this.authService.canWriteResource(this.world);

    // Create the bibtex
    const date = new Date(this.world.modifyDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

    const url = decodeURIComponent(this.worldService.getBaseUrl(this.world.owner, this.world.name));

    this.bibTex = `@online{GazeboFuel-` +
    `${this.world.owner.split(' ').join('-')}-` +
    `${this.world.name.split(' ').join('-')},`;
    this.bibTex += `\n\ttitle={${this.world.name}},`;
    this.bibTex += `\n\torganization={Open Robotics},`;
    this.bibTex += `\n\tdate={${date.getFullYear()}},`;
    this.bibTex += `\n\tmonth={${monthNames[date.getMonth()]}},`;
    this.bibTex += `\n\tday={${date.getDay()}},`;
    this.bibTex += `\n\tauthor={${this.world.owner}},`;
    this.bibTex += `\n\turl={${url}},\n}`;

    // The world's description, used to set meta tags.
    const description = this.world.description !== undefined &&
      this.world.description !== '' ? this.world.description :
      'A world on the Gazebo App.';

    // Update header meta data. This assumes that index.html has been
    // populated with default values for each of the tags. If you add new tags,
    // then also add a default value to src/index.html
    this.metaService.updateTag({name: 'og:title', content: this.world.name});
    this.metaService.updateTag({name: 'og:description', content: description});
    this.metaService.updateTag({name: 'og:url', content: url});
    this.metaService.updateTag({name: 'twitter:card',
      content: 'summary_large_image'});
    this.metaService.updateTag({name: 'twitter:title',
      content: this.world.name});
    this.metaService.updateTag({name: 'twitter:description',
      content: description});
    this.metaService.updateTag({name: 'twitter:image:alt',
      content: this.world.name});
    if (this.world.images.length > 0) {
      this.metaService.updateTag({name: 'og:image',
        content: this.world.images[0].url});
      this.metaService.updateTag({name: 'twitter:image',
        content: this.world.images[0].url});
    }
  }

  /**
   * OnDestroy Lifecycle hook.
   *
   * Unsubscribes from Observables and revokes any ObjectURL created.
   */
  public ngOnDestroy(): void {
    if (this.collectionDialogSubscription) {
      this.collectionDialogSubscription.unsubscribe();
    }

    // Revoke the URLs of the Gallery.
    if (this.galleryImages && this.galleryImages.length !== 0) {
      this.galleryImages.forEach((galleryImage) => {
        URL.revokeObjectURL(
          this.sanitizer.sanitize(SecurityContext.URL, galleryImage));
      });
    }
  }

  /**
   * Callback for the World Download button.
   */
  public downloadClick(): void {
    this.worldService.download(this.world, this.currentVersion)
      .subscribe(
        (file) => {
          FileSaver.saveAs(file, `${this.world.name}.zip`);

          // Refresh the World.
          this.worldService.get(this.world.owner, this.world.name).subscribe(
            (world) => {
              this.world = world;
              this.getFiles();
            });
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });
  }

  /**
   * Callback to download an individual file of the world.
   *
   * @param file The file to download.
   */
  public downloadIndividualFile(file: File): void {
    const url = this.worldService.getIndividualFileUrl(this.world, file, this.currentVersion);
    this.worldService.getFileAsBlob(url).subscribe(
      (response) => {
        FileSaver.saveAs(response, file.name);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      });
  }

  /**
   * Callback for the World Like button.
   */
  public likeClick(): void {
    let request;
    this.disableLike = true;

    // The current like state determines if the world should be Liked or Unliked.
    if (!this.world.isLiked) {
      request = this.worldService.like(this.world);
    } else {
      request = this.worldService.unlike(this.world);
    }

    request.pipe(
      switchMap((result) => {
        return this.worldService.get(this.world.owner, this.world.name);
      })
    ).subscribe(
      (world) => {
        this.world = world;
        this.getFiles();
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      },
      () => {
        this.disableLike = false;
      }
    );
  }

  /**
   * Callback for the World Copy button.
   */
  public copyWorld(): void {
    const dialogOps = {
      disableClose: true,
      data: {
        title: 'Copy world',
        message: `<p>Add a copy of the world to your account or into an organization.</p>
          <p>Please enter a new name and owner for the copied world.</p>`,
        name: this.world.name,
        namePlaceholder: 'World name',
        owner: this.authService.userProfile.username,
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        busyMessage: `<p>Copying the world into the account.</p>`,
      }
    };

    this.copyNameDialog = this.dialog.open(CopyDialogComponent, dialogOps);

    // Subscribe to the dialog's submit method.
    this.copyNameDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        if (result !== undefined && result.copyName.trim() !== '') {
          this.copyNameDialog.componentInstance.busy = true;
          this.worldService.copy(this.world, result.copyName.trim(), result.copyOwner)
            .subscribe(
              (response) => {
                this.copyNameDialog.close();

                this.snackBar.open(`${response.name} was created`, 'Got it', { duration: 2750 });
                this.router.navigate([`/${response.owner}/worlds/${response.name}`]);
              },
              (error) => {
                this.snackBar.open(error.message, 'Got it');
              });
        } else {
          this.copyNameDialog.componentInstance.busy = false;
        }
      });
  }

  /**
   * Opens a dialog to choose a reason to report this world.
   */
  public report(): void {

    const dialogOptions = {
      data: {
        title: 'Report world',
        name: this.world.name,
        owner: this.world.owner,
      },
    };

    this.reportWorldDialog = this.dialog.open(ReportDialogComponent, dialogOptions);

    this.reportWorldDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        this.worldService.report(this.world, result.reason).subscribe(
          () => {
            this.reportWorldDialog.close();
            this.snackBar.open(
              `World reported. Reason: ${result.reason}`,
              'Got it',
              {
                duration: 2750,
              },
            );
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it', {
              duration: 2750,
            });
          },
        );
      },
    );
  }

  /**
   * Opens the Collection Dialog, to create a new collection or add the world into an existing one.
   */
  public addToCollection(): void {
    const dialogOps = {
      data: {
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        resource: this.world
      }
    };

    this.collectionDialog = this.dialog.open(CollectionDialogComponent, dialogOps);

    // Subscribes to the close event of the dialog.
    this.collectionDialogSubscription = this.collectionDialog.afterClosed().subscribe(
      (result) => {
        if (result === true) {
          // The World was added to a collection. Refresh them.
          this.loadCollections();
        }
      }
    );
  }

  /**
   * Title of the Like Button.
   *
   * @returns The title of the like button, according to its state.
   */
  public getLikeButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Log in to like this world';
    } else {
      if (!this.world.isLiked) {
        return 'Like this world';
      } else {
        return 'Stop liking this world';
      }
    }
  }

  /**
   * Title of the Copy Button.
   *
   * @returns The title of the copy button, whether the world can be copied or not.
   */
  public getCopyButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Log in to copy this world';
    }
    if (this.currentVersion !== this.latestVersion) {
      return 'Only the latest version can be copied';
    }
    return 'Copy this world';
  }

  /**
   * Get the files of the World.
   */
  public getFiles(): void {
    this.worldService.getFileTree(this.world, this.currentVersion)
      .pipe(
        finalize(() => {
          // Executes after any response from the subscribe method.
          this.setupGallery();
        })
      )
      .subscribe(
        (response) => {
          const files = response['file_tree'];
          this.world.files = [];
          for (const file of files) {
            this.extractFile(file);
          }
          // Once we have the files, populate the thumbnails.
          const worldUrl = this.worldService.getBaseVersionUrl(
            this.world.owner, this.world.name, this.currentVersion);
          this.world.populateThumbnails(worldUrl);
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });
  }

  /**
   * Callback when version is changed
   */
  public onVersion(): void {
    this.view3d = false;
    this.getFiles();
    this.location.go(`${this.world.owner}/worlds/${this.world.name}/${this.currentVersion}`);
  }

  /**
   * Load the collections that have this World.
   *
   * @param event Optional. The page event that contains the pagination data of collections to load.
   */
  public loadCollections(event?: PageEvent): void {
    const params = event ? {
      page: event.pageIndex + 1,
      per_page: event.pageSize
    } : {};
    this.collectionService.getAssetCollections(this.world, params).subscribe({
      next: (response) => {
        // DEVNOTE: This change is not reflected in the Client URL.
        this.paginatedCollections = response;
        this.collections = response.collections;
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Got it');
      },
    });
  }

  /**
   * Populates the image gallery with the world images and sets the options.
   */
  public setupGallery(): void {
    // Verify that the world has images.
    if (this.world.images && this.world.images.length !== 0) {
      const newGalleryImages: SafeUrl[] = [];

      // To ensure the thumbnails are received in order.
      const requests = [];
      this.world.images.forEach((image) => {
        requests.push(this.worldService.getFileAsBlob(image.url));
      });
      forkJoin(requests).subscribe(
        (response) => {
          // The response contains the Blobs of all thumbnails, in the order they were requested.
          response.forEach((blob) => {
            const imageUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(
              URL.createObjectURL(blob));
            newGalleryImages.push(imageUrl);
          });
          // All the images were processed at this point.

          // Set the images and correct options.
          this.galleryImages = newGalleryImages;
        }
      );
    } else {
      // World has no images. Set the gallery images accordingly.
      this.galleryImages = [];
    }
  }

  /**
   * Callback for the bibtex copy button. Copies the bibtex to the clipboard.
   */
  public copyBibtex(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.bibTex;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.snackBar.open('Bibtex copied to clipboard.', '', {
      duration: 2000
    });
  }

  /**
   * Make the viewport fullscreen
   */
  public openFullscreen(): void {
    const elem = this.divRef.nativeElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  }

  /**
   * Reset the camera view
   */
  public resetView(): void {
    this.sdfViewer.resetCameraPose();
  }

  /**
   * Open / close SDF viewer.
   * Note: since we're using ngIf, a new <gz-sdfviewer> is created each time this
   * is toggled.
   */
  public toggle3D(): void {
    this.view3d = !this.view3d;
  }

  /**
   * Callback for the copy SDF button. Copies the current URL to the clipboard.
   */
  public copyWorldURL(): void {
    const selBox = document.createElement('textarea');
    const url = decodeURIComponent(this.worldService.getBaseUrl(this.world.owner, this.world.name));
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = `"${url}"`;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.snackBar.open('SDF world URI copied to clipboard.', '', {
      duration: 2000
    });
  }
  /**
   * Extract files that contain no children from the File Tree nodes.
   *
   * @param file The current node of the File Tree.
   */
  private extractFile(file: any): void {
    // End condition. If it has no children, it's a file.
    if (!file.children) {
      // The path to display has the following format: "WorldName > Folder"
      const displayPath = `${this.world['name']}${file.path.replace(`/${file.name}`, '')}`;
      file.displayPath = displayPath.replace(/\//g, ' > ');
      this.world.files.push(file);
    } else {
      // If it contains children, it's a folder.
      for (const child of file.children) {
        this.extractFile(child);
      }
    }
  }
}
