import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Meta } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';

import { AuthPipe } from '../auth/auth.pipe';
import { AuthService } from '../auth/auth.service';
import { Collection } from './collection';
import { CollectionService } from './collection.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { CopyDialogComponent } from '../fuel-resource/copy-dialog/copy-dialog.component';
import { DescriptionComponent } from '../description';
import { FuelResourceListComponent } from '../fuel-resource';
import { ModelService } from '../model/model.service';
import { PageTitleComponent } from '../page-title';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { WorldService } from '../world/world.service';

@Component({
  selector: 'gz-collection',
  templateUrl: 'collection.component.html',
  styleUrls: ['collection.component.scss'],
  standalone: true,
  imports: [
    AuthPipe,
    CommonModule,
    DescriptionComponent,
    FlexLayoutModule,
    FormsModule,
    FuelResourceListComponent,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTabsModule,
    PageTitleComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
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
   * Active tab in the tab group.
   */
  public activeTab: 'models' | 'worlds' = 'models';

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
    private metaService: Meta) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {

    // Retrieve the collection from the activated route's data.
    if (this.activatedRoute.snapshot.data['resolvedData'] !== undefined) {
      this.collection = this.activatedRoute.snapshot.data['resolvedData'];
    }

    // Get the collection's models.
    this.collectionService.getCollectionModels(this.collection.owner, this.collection.name)
      .subscribe(
        (response) => {
          this.paginatedModels = response;
          this.collection.models = response.resources;
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });

    // Get the collection's worlds.
    this.collectionService.getCollectionWorlds(this.collection.owner, this.collection.name)
      .subscribe(
        (response) => {
          this.paginatedWorlds = response;
          this.collection.worlds = response.resources;
        },
        (error) => {
          this.snackBar.open(error.message, 'Got it');
        });

    // Determine whether the logged user can edit this collection.
    // TODO(german-mas): Avoid duplicated code by having a "canEditResource" method in the User
    // Class, and using an Authenticated User.
    // See https://app.asana.com/0/719578238881157/756403371264694/f
    this.canEdit = this.authService.isAuthenticated() &&
      (this.collection.owner === this.authService.userProfile.username ||
      this.authService.userProfile['orgs'].includes(this.collection.owner));

    // Create the bibtex
    const date = new Date(this.collection.modifyDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

    this.bibTex = `@online{GazeboFuel-` +
    `${this.collection.owner.split(' ').join('-')}-` +
    `${this.collection.name.split(' ').join('-')},`;
    this.bibTex += `\n\ttitle={${this.collection.name}},`;
    this.bibTex += `\n\torganization={Open Robotics},`;
    this.bibTex += `\n\tdate={${date.getFullYear()}},`;
    this.bibTex += `\n\tmonth={${monthNames[date.getMonth()]}},`;
    this.bibTex += `\n\tday={${date.getDay()}},`;
    this.bibTex += `\n\tauthor={${this.collection.owner}},`;
    this.bibTex += `\n\turl={${this.collectionService.baseUrl + this.router.url}},\n}`;

    this.downloadCommand = 'python3 download_collection.py -o "' +
      this.collection.owner + '" -c "' + this.collection.name + '"';

    // The collections's description, used to set meta tags.
    const description = this.collection.description !== undefined &&
      this.collection.description !== '' ? this.collection.description :
      'A collection on the Gazebo App.';

    // Update header meta data. This assumes that index.html has been
    // populated with default values for each of the tags. If you add new tags,
    // then also add a default value to src/index.html
    this.metaService.updateTag({name: 'og:title', content: this.collection.name});
    this.metaService.updateTag({name: 'og:description', content: description});
    this.metaService.updateTag({name: 'og:url',
      content: this.collectionService.baseUrl + this.router.url});
    this.metaService.updateTag({name: 'twitter:card',
      content: 'summary_large_image'});
    this.metaService.updateTag({name: 'twitter:title',
      content: this.collection.name});
    this.metaService.updateTag({name: 'twitter:description',
      content: description});
    this.metaService.updateTag({name: 'twitter:image:alt',
      content: this.collection.name});
    if (this.collection.thumbnails.length > 0) {
      this.metaService.updateTag({name: 'og:image',
        content: this.collection.thumbnails[0].url});
      this.metaService.updateTag({name: 'twitter:image',
        content: this.collection.thumbnails[0].url});
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
        buttonText: 'Delete',
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result !== true) {
            return;
          }

          // Request deletion.
          this.collectionService.deleteCollection(this.collection.owner, this.collection.name)
            .subscribe(
              (response) => {
                this.snackBar.open(`${this.collection.name} was removed`, 'Got it', {
                  duration: 2750
                });
                this.router.navigate([this.collection.owner + '/collections']);
              },
              (error) => {
                this.snackBar.open(`${error.message}`, 'Got it');
              });
        });
  }

  /**
   * Loads the next page of models.
   *
   * @param event The page event that contains the pagination data of models to load.
   */
  public loadModels(event: PageEvent): void {
    this.collectionService.getCollectionModels(this.collection.owner, this.collection.name, {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    }).subscribe(
      (paginatedModels) => {
        // DEVNOTE: This change is not reflected in the Client URL.
        this.paginatedModels = paginatedModels;
        this.collection.models = paginatedModels.resources;
      }
    );
  }

  /**
   * Loads the next page of worlds.
   *
   * @param event The page event that contains the pagination data of worlds to load.
   */
  public loadWorlds(event: PageEvent): void {
    this.worldService.getList({
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    }).subscribe(
      (paginatedWorlds) => {
        // DEVNOTE: This change is not reflected in the Client URL.
        this.paginatedWorlds = paginatedWorlds;
        this.collection.worlds = paginatedWorlds.resources;
      }
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
        buttonText: 'Remove',
      }
    };

    this.confirmationDialog = this.dialog.open(ConfirmationDialogComponent, dialogOps);

    // Callback when the Dialog is closed.
    this.confirmationDialog.afterClosed()
      .subscribe(
        (result) => {
          if (result !== true) {
            return;
          }

          // Request deletion.
          this.collectionService.removeAsset(this.collection.owner, this.collection.name, resource)
          .subscribe(
            (response) => {
              // Determine from which list to remove the resource and update the counter.
              let resourceList;
              if (event.type === 'models') {
                resourceList = this.collection.models;
                this.paginatedModels.totalCount--;
              }
              if (event.type === 'worlds') {
                resourceList = this.collection.worlds;
                this.paginatedWorlds.totalCount--;
              }

              const index = resourceList.indexOf(resource);
              resourceList.splice(index, 1);
              this.snackBar.open(`${resource.name} was removed from ${this.collection.name}`,
                'Got it',
                { duration: 2750 });
            },
            (error) => {
              this.snackBar.open(`${error.message}`, 'Got it');
            });
        });
  }

  /**
   * Callback when the tab is changed. Determines the current active tab.
   */
  public setActiveTab(event: number): void {
    switch (event) {
      case 0: {
        this.activeTab = 'models';
        break;
      }
      case 1: {
        this.activeTab = 'worlds';
        break;
      }
    }
  }

  /**
   * Callback when enter key is pressed on search input.
   *
   * @param search Search string.
   */
  public onSearch(search: string): void {
    let searchFinal = 'collections:' + this.collection.name;

    // Replace ampersand with %26 so that it gets sent over the wire
    // correctly.
    // todo: Consider supporting form search, instead of only a single "?q"
    // parameter.
    if (search !== null && search !== undefined && search !== '') {
      searchFinal += '&' + search;
    }

    // Get the searched models.
    this.modelService.getList({search: searchFinal}).subscribe(
        (models) => {
          if (models !== undefined) {
            this.paginatedModels = models;
            this.collection.models = models.resources;
          }
        },
        (error) => {
          console.error('Error searching models', error);
          this.snackBar.open(error.message, 'Got it');
        }
      );

    // Get the searched worlds.
    this.worldService.getList({search: searchFinal}).subscribe(
        (worlds) => {
          if (worlds !== undefined) {
            this.paginatedWorlds = worlds;
            this.collection.worlds = worlds.resources;
          }
        },
        (error) => {
          console.error('Error searching worlds', error);
          this.snackBar.open(error.message, 'Got it');
        }
      );
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
   * Callback for the download command copy button. Copies the download
   * command to the clipboard.
   */
  public copyDownloadCommand(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.downloadCommand;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.snackBar.open('Command copied to clipboard.', '', {
      duration: 2000
    });
  }

  /**
   * Title of the Copy Button.
   *
   * @returns The title of the copy button, whether the collection can be copied or not.
   */
  public getCopyButtonTitle(): string {
    if (!this.authService.isAuthenticated()) {
      return 'Log in to copy this collection';
    }
    return 'Copy this collection';
  }

  /**
   * Callback for the Collection Copy button.
   */
  public copyCollection(): void {
    const dialogOps = {
      disableClose: true,
      data: {
        title: 'Copy collection',
        message: `<p>Add a copy of the collection to your account or into an organization.</p>
          <p>Please enter a new name and owner for the copied collection.</p>`,
        name: this.collection.name,
        namePlaceholder: 'Collection name',
        owner: this.authService.userProfile.username,
        ownerList: [this.authService.userProfile.username,
          ...this.authService.userProfile.orgs.sort()],
        busyMessage: `<p>Copying the collection into the account.</p>`,
      }
    };

    this.copyNameDialog = this.dialog.open(CopyDialogComponent, dialogOps);

    // Subscribe to the dialog's submit method.
    this.copyNameDialog.componentInstance.onSubmit.subscribe(
      (result) => {
        if (result !== undefined && result.copyName.trim() !== '') {
          this.copyNameDialog.componentInstance.busy = true;
          this.collectionService.copy(this.collection, result.copyName.trim(), result.copyOwner)
            .subscribe(
              (response) => {
                this.copyNameDialog.close();

                this.snackBar.open(`${response.name} was created`, 'Got it', { duration: 2750 });
                this.router.navigate([`/${response.owner}/collections/${response.name}`]);
              },
              (error) => {
                this.snackBar.open(error.message, 'Got it');
              });
        } else {
          this.copyNameDialog.componentInstance.busy = false;
        }
      });
  }
}
