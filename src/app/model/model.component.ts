import { Component, OnInit, OnDestroy, SecurityContext, ViewEncapsulation, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Meta, DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { Collection, CollectionService, PaginatedCollection } from '../collection';
import { CollectionDialogComponent } from '../collection/dialog/collection-dialog.component';
import { CopyDialogComponent } from '../fuel-resource/copy-dialog/copy-dialog.component';
import { Model } from './model';
import { ModelService } from './model.service';
import { ReportDialogComponent } from '../fuel-resource/report-dialog/report-dialog.component';
import { SdfViewerComponent } from './sdfviewer/sdfviewer.component';

import * as FileSaver from 'file-saver';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'gz-model',
  templateUrl: 'model.component.html',
  styleUrls: ['model.component.scss']
})

/**
 * Model Component is the page that display the details of a single model.
 *
 * TODO(german.e.mas) Refactor common code between Model and World component.
 * See https://app.asana.com/0/851925973517080/899265102507497/f
 */
export class ModelComponent implements OnInit, OnDestroy {

  /**
   * The model represented by this Component. It is fetched using a Route Resolver.
   */
  public model: Model;

  /**
   * Indicates whether the current user has permission to edit this model
   */
  public canEdit: boolean = false;

  /**
   * The images to be displayed in the gallery.
   */
  public galleryImages: SafeUrl[];

  /**
   * GzWeb visualizer flag.
   */
  public hasGzWeb: boolean;

  /**
   * Are we rendering sdfviewer scene.
   */
  public view3d: boolean;

  /**
   * Disable the like button. This helps to prevent multiple calls.
   */
  public disableLike: boolean = false;

  /**
   * Number of the latest version for this model.
   */
  public latestVersion: number;

  /**
   * Number of the current version being displayed.
   */
  public currentVersion: number;

  /**
   * List of collections that have this model.
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
   * Bibtex for this model.
   */
  public bibTex: string;

  /**
   * Dialog to prompt the user about the Model name and owner for copying.
   */
  private copyNameDialog: MatDialogRef<CopyDialogComponent>;

  /**
   * Dialog to report a model
   */
  private reportModelDialog: MatDialogRef<ReportDialogComponent>;

  /**
   * Dialog to add the model into a collection (or create one).
   */
  private collectionDialog: MatDialogRef<CollectionDialogComponent>;

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
   * @param modelService Service used to get Model information from the Server
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
    private modelService: ModelService,
    private router: Router,
    public snackBar: MatSnackBar,
    private metaService: Meta,
    private sanitizer: DomSanitizer) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the model obtained from the Route Resolver, and gets its URL and files.
   */
  public ngOnInit(): void {
    // Check if the browser supports WebGL.
    const canvas = document.createElement('canvas');
    this.hasGzWeb = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));

    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.model = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Latest version
    if (this.model !== undefined && this.model.versions !== undefined) {
      this.latestVersion = this.model.versions[this.model.versions.length - 1];
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

    this.canEdit = this.authService.canWriteResource(this.model);

    // Create the bibtex
    const date = new Date(this.model.modifyDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

    const url = decodeURIComponent(this.modelService.getBaseUrl(this.model.owner, this.model.name));

    this.bibTex = `@online{GazeboFuel-` +
    `${this.model.owner.split(' ').join('-')}-` +
    `${this.model.name.split(' ').join('-')},`;
    this.bibTex += `\n\ttitle={${this.model.name}},`;
    this.bibTex += `\n\torganization={Open Robotics},`;
    this.bibTex += `\n\tdate={${date.getFullYear()}},`;
    this.bibTex += `\n\tmonth={${monthNames[date.getMonth()]}},`;
    this.bibTex += `\n\tday={${date.getDay()}},`;
    this.bibTex += `\n\tauthor={${this.model.owner}},`;
    this.bibTex += `\n\turl={${url}},\n}`;

    // The model's description, used to set meta tags.
    const description = this.model.description !== undefined &&
      this.model.description !== '' ? this.model.description :
      'A model on the Gazebo App.';

    // Update header meta data. This assumes that index.html has been
    // populated with default values for each of the tags. If you add new tags,
    // then also add a default value to src/index.html
    this.metaService.updateTag({name: 'og:title', content: this.model.name});
    this.metaService.updateTag({name: 'og:description', content: description});
    this.metaService.updateTag({name: 'og:url', content: url});
    this.metaService.updateTag({name: 'twitter:card',
      content: 'summary_large_image'});
    this.metaService.updateTag({name: 'twitter:title',
      content: this.model.name});
    this.metaService.updateTag({name: 'twitter:description',
      content: description});
    this.metaService.updateTag({name: 'twitter:image:alt',
      content: this.model.name});
    if (this.model.images.length > 0) {
      this.metaService.updateTag({name: 'og:image',
        content: this.model.images[0].url});
      this.metaService.updateTag({name: 'twitter:image',
        content: this.model.images[0].url});
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
   * Callback for the link button. Copies the current URL to the clipboard.
   */
  public copySdfInclude(): void {
    const selBox = document.createElement('textarea');
    const url = decodeURIComponent(this.modelService.getBaseUrl(this.model.owner, this.model.name));
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = `<include>\n<uri>\n${url}\n</uri>\n</include>`;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.snackBar.open('SDF include snippet copied to clipboard.', '', {
      duration: 2000
    });
  }

  /**
   * Callback for the Model Download button. Downloads the model as a zip and
   * refreshes it.
   */
  public downloadClick(): void {
    this.modelService.download(this.model, this.currentVersion)
      .subscribe(
        (file) => {
          FileSaver.saveAs(file, `${this.model.name}.zip`);

          // Refresh the Model.
          this.modelService.get(this.model.owner, this.model.name).subscribe(
            (model) => {
              this.model = model;
              this.getFiles();
            });
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });
  }

  /**
   * Callback to download an individual file of the model.
   *
   * @param file The file to download.
   */
  public downloadIndividualFile(file: File): void {
    const url = this.modelService.getIndividualFileUrl(this.model, file, this.currentVersion);
    this.modelService.getFileAsBlob(url).subscribe(
      (response) => {
        FileSaver.saveAs(response, file.name);
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      });
  }

  /**
   * Callback for the Model Like button.
   */
  public likeClick(): void {
    let request;
    this.disableLike = true;

    // The current like state determines if the model should be Liked or Unliked.
    if (!this.model.isLiked) {
      request = this.modelService.like(this.model);
    } else {
      request = this.modelService.unlike(this.model);
    }

    request.pipe(
      switchMap((result) => {
        return this.modelService.get(this.model.owner, this.model.name);
      })
    ).subscribe(
      (model) => {
        this.model = model;
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
   * Callback for the Model Copy button.
   */
  public copyModel(): void {
    const dialogOps = {
      disableClose: true,
      data: {
        title: 'Copy model',
        message: `<p>Add a copy of the model to your account or into an organization.</p>
          <p>Please enter a new name and owner for the copied model.</p>`,
        name: this.model.name,
        namePlaceholder: 'Model name',
        owner: this.authService.userProfile.username,
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        busyMessage: `<p>Copying the model into the account.</p>`,
      }
    };

    this.copyNameDialog = this.dialog.open(CopyDialogComponent, dialogOps);

    // Subscribe to the dialog's submit method.
    this.copyNameDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        if (result !== undefined && result.copyName.trim() !== '') {
          this.copyNameDialog.componentInstance.busy = true;
          this.modelService.copy(this.model, result.copyName.trim(), result.copyOwner)
            .subscribe(
              (response) => {
                this.copyNameDialog.close();

                this.snackBar.open(`${response.name} was created`, 'Got it', { duration: 2750 });
                this.router.navigate([`/${response.owner}/models/${response.name}`]);
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
   * Opens the Collection Dialog, to create a new collection or add the model into an existing one.
   */
  public addToCollection(): void {
    const dialogOps = {
      data: {
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        resource: this.model
      }
    };

    this.collectionDialog = this.dialog.open(CollectionDialogComponent, dialogOps);

    // Subscribes to the close event of the dialog.
    this.collectionDialogSubscription = this.collectionDialog.afterClosed().subscribe(
      (result) => {
        if (result === true) {
          // The Model was added to a collection. Refresh them.
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
      return 'Log in to like this model';
    } else {
      if (!this.model.isLiked) {
        return 'Like this model';
      } else {
        return 'Stop liking this model';
      }
    }
  }

  /**
   * Title of the Copy Button.
   *
   * @returns The title of the copy button, whether the model can be copied or not.
   */
  public getCopyButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Log in to copy this model';
    }
    if (this.currentVersion !== this.latestVersion) {
      return 'Only the latest version can be copied';
    }
    return 'Copy this model';
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
   * Get the files of the Model.
   */
  public getFiles(): void {
    this.modelService.getFileTree(this.model, this.currentVersion).pipe(
      finalize(
        () => {
          // Executes after any response from the subscribe method.
          this.setupGallery();
        })
      )
      .subscribe(
        (response) => {
          const files = response['file_tree'];
          this.model.files = [];
          for (const file of files) {
            this.extractFile(file);
          }
          // Once we have the files, populate the thumbnails.
          const modelUrl = this.modelService.getBaseVersionUrl(
            this.model.owner, this.model.name, this.currentVersion);
          this.model.populateThumbnails(modelUrl);
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        }
      );
  }

  /**
   * Opens a dialog to choose a reason to report this model.
   */
  public report(): void {

    const dialogOptions = {
      data: {
        title: 'Report model',
        name: this.model.name,
        owner: this.model.owner,
      },
    };

    this.reportModelDialog = this.dialog.open(ReportDialogComponent, dialogOptions);

    this.reportModelDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        this.modelService.report(this.model, result.reason).subscribe(
          () => {
            this.reportModelDialog.close();
            this.snackBar.open(
              `Model reported. Reason: ${result.reason}`,
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
   * Callback when version is changed
   */
  public onVersion(): void {
    this.view3d = false;
    this.getFiles();
    this.location.go(`${this.model.owner}/models/${this.model.name}/${this.currentVersion}`);
  }

  /**
   * Callback for the link button. Copies the current URL to the clipboard.
   */
  public getDragUrl(): string {
    return decodeURIComponent(this.modelService.getBaseUrl(this.model.owner, this.model.name));
  }

  /**
   * Load the collections that have this Model.
   *
   * @param event Optional. The page event that contains the pagination data of collections to load.
   */
  public loadCollections(event?: PageEvent): void {
    const params = event ? {
      page: event.pageIndex + 1,
      per_page: event.pageSize
    } : {};
    this.collectionService.getAssetCollections(this.model, params).subscribe({
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
   * Populates the image gallery with the model images and sets the options.
   */
  public setupGallery(): void {
    // Verify that the model has images.
    if (this.model.images && this.model.images.length !== 0) {
      const newGalleryImages: SafeUrl[] = [];

      // To ensure the thumbnails are received in order.
      const requests = [];
      this.model.images.forEach((image) => {
        requests.push(this.modelService.getFileAsBlob(image.url));
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
      // Model has no images. Set the gallery images accordingly.
      this.galleryImages = [];
    }
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
   * Extract files that contain no children from the File Tree nodes.
   *
   * @param file The current node of the File Tree.
   */
  private extractFile(file: any): void {
    // End condition. If it has no children, it's a file.
    if (!file.children) {
      // The path to display has the following format: "ModelName > Folder"
      const displayPath = `${this.model['name']}${file.path.replace(`/${file.name}`, '')}`;
      file.displayPath = displayPath.replace(/\//g, ' > ');
      this.model.files.push(file);
    } else {
      // If it contains children, it's a folder.
      for (const child of file.children) {
        this.extractFile(child);
      }
    }
  }
}
