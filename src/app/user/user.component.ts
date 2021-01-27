import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Model } from '../model/model';
import { ModelService } from '../model/model.service';
import { User } from './user';
import { World } from '../world/world';
import { WorldService } from '../world/world.service';
import { PaginatedModels } from '../model/paginated-models';
import { PaginatedWorlds } from '../world/paginated-worlds';
import { Collection, CollectionService, PaginatedCollection } from '../collection';

@Component({
  selector: 'ign-user',
  templateUrl: 'user.component.html',
  styleUrls: ['user.component.scss']
})

/**
 * User Component displays the resources related to a User.
 */
export class UserComponent implements OnInit {

  /**
   * The user being displayed by the component. It comes from a route resolver.
   */
  public user: User;

  /**
   * The list of models of the user.
   */
  public models: Model[];

  /**
   * Paginated Models. Contains the amount of models the user has uploaded, as well as
   * the page the following models should be obtained.
   */
  public paginatedModels: PaginatedModels;

  /**
   * The list of models of the user that are currently under review.
   */
  public underReviewModels: Model[];

  /**
   * Paginated Models that are under review.
   * Contains the amount of models the user has uploaded, as well as
   * the page the following models should be obtained.
   */
  public paginatedUnderReviewModels: PaginatedModels;

  /**
   * The list of models the user has liked.
   */
  public modelsLiked: Model[];

  /**
   * Paginated Liked Models. Contains the amount of models the user has liked, as well as
   * the page the following models should be obtained.
   */
  public paginatedLikedModels: PaginatedModels;

  /**
   * The list of worlds of the user.
   */
  public worlds: World[];

  /**
   * Paginated Worlds. Contains the amount of worlds the user has uploaded, as well as
   * the page the following worlds should be obtained.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * The list of worlds the user has liked.
   */
  public worldsLiked: World[];

  /**
   * Paginated Liked Worlds. Contains the amount of worlds the user has liked, as well as
   * the page the following worlds should be obtained.
   */
  public paginatedLikedWorlds: PaginatedWorlds;

  /**
   * The list of collections the user has.
   */
  public collections: Collection[];

  /**
   * Paginated Collections. Contains the amount of collections the user has, as well as
   * the page the following collections should be obtained.
   */
  public paginatedCollections: PaginatedCollection;

  /**
   * Active tab in the tab group.
   */
  public activeTab: 'models' | 'modelsUnderReview' | 'modelsLiked' | 'worlds' | 'worldsLiked' | 'collections' = 'models';

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param collectionService Service used to fetch the user's collections.
   * @param modelService Service used to fetch the user's models.
   * @param snackBar Snackbar used to display notifications.
   * @param worldService Service used to fetch the user's worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    public collectionService: CollectionService,
    public modelService: ModelService,
    public snackBar: MatSnackBar,
    public worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   */
  public ngOnInit(): void {

    // Get the User from the resolved data.
    this.user = this.activatedRoute.snapshot.data['resolvedData'];

    // Get the User's models.
    this.modelService.getOwnerList(this.user.username).subscribe(
      (response) => {
        this.paginatedModels = response;
        this.models = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the User's models that are under review.
    this.modelService.getOwnerModelsUnderReviewList(this.user.username).subscribe(
      (response) => {
        this.paginatedUnderReviewModels = response;
        this.underReviewModels = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the User's worlds.
    this.worldService.getOwnerList(this.user.username).subscribe(
      (response) => {
        this.paginatedWorlds = response;
        this.worlds = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the User's liked models.
    this.modelService.getUserLikedList(this.user.username).subscribe(
      (response) => {
        this.paginatedLikedModels = response;
        this.modelsLiked = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the User's liked worlds.
    this.worldService.getUserLikedList(this.user.username).subscribe(
      (response) => {
        this.paginatedLikedWorlds = response;
        this.worldsLiked = response.resources;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );

    // Get the User's collections.
    this.collectionService.getOwnerCollectionList(this.user.username).subscribe(
      (response) => {
        this.paginatedCollections = response;
        this.collections = response.collections;
      },
      (error) => {
        this.snackBar.open(error.message, 'Got it');
      }
    );
  }

  /**
   * Loads the next page of models.
   */
  public loadNextModelsPage(): void {
    if (this.paginatedModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedModels).subscribe(
        (pagModels) => {
          this.paginatedModels = pagModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.models.slice();
          for (const model of pagModels.resources) {
            newModels.push(model);
          }
          this.models = newModels;
        }
      );
    }
  }

  /**
   * Loads the next page of worlds.
   */
  public loadNextWorldsPage(): void {
    if (this.paginatedWorlds.hasNextPage()) {
      this.worldService.getNextPage(this.paginatedWorlds).subscribe(
        (pagWorlds) => {
          this.paginatedWorlds = pagWorlds;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.worlds.slice();
          for (const world of pagWorlds.resources) {
            newWorlds.push(world);
          }
          this.worlds = newWorlds;
        }
      );
    }
  }

  /**
   * Loads the next page of models under review.
   */
  public loadNextUnderReviewModelsPage(): void {
    if (this.paginatedUnderReviewModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedUnderReviewModels).subscribe(
        (pagModels) => {
          this.paginatedModels = pagModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.underReviewModels.slice();
          for (const model of pagModels.resources) {
            newModels.push(model);
          }
          this.underReviewModels = newModels;
        }
      );
    }
  }

  /**
   * Loads the next page of liked models.
   */
  public loadNextLikedModelsPage(): void {
    if (this.paginatedLikedModels.hasNextPage()) {
      this.modelService.getNextPage(this.paginatedLikedModels).subscribe(
        (pagModels) => {
          this.paginatedLikedModels = pagModels;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newModels = this.modelsLiked.slice();
          for (const model of pagModels.resources) {
            newModels.push(model);
          }
          this.modelsLiked = newModels;
        }
      );
    }
  }

  /**
   * Loads the next page of liked worlds.
   */
  public loadNextLikedWorldsPage(): void {
    if (this.paginatedLikedWorlds.hasNextPage()) {
      this.worldService.getNextPage(this.paginatedLikedWorlds).subscribe(
        (pagWorlds) => {
          this.paginatedLikedWorlds = pagWorlds;
          // Copy and extend the existing array of worlds with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.worldsLiked.slice();
          for (const model of pagWorlds.resources) {
            newWorlds.push(model);
          }
          this.worldsLiked = newWorlds;
        }
      );
    }
  }

  /**
   * Loads the next page of collections.
   */
  public loadNextCollectionsPage(): void {
    if (this.paginatedCollections.hasNextPage()) {
      this.collectionService.getNextPage(this.paginatedCollections).subscribe(
        (pagCollections) => {
          this.paginatedCollections = pagCollections;
          // Copy and extend the existing array of collections with the new ones.
          // A copy is required in order to trigger changes.
          const newCollections = this.collections.slice();
          for (const col of pagCollections.collections) {
            newCollections.push(col);
          }
          this.collections = newCollections;
        }
      );
    }
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
        this.activeTab = 'modelsUnderReview';
        break;
      }
      case 2: {
        this.activeTab = 'modelsLiked';
        break;
      }
      case 3: {
        this.activeTab = 'worlds';
        break;
      }
      case 4: {
        this.activeTab = 'worldsLiked';
        break;
      }
      case 5: {
        this.activeTab = 'collections';
        break;
      }
    }
  }
}
