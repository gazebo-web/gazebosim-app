import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, switchMap, debounceTime } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { Collection } from '../collection';
import { CollectionService } from '../collection.service';
import { ErrMsg } from '../../server/err-msg';
import { FuelResource } from '../../fuel-resource';

@Component({
  selector: 'gz-collection-dialog',
  templateUrl: 'collection-dialog.component.html',
  styleUrls: ['collection-dialog.component.scss']
})

/**
 * Dialog used to add a resource into an existing Collection, or create one.
 */
export class CollectionDialogComponent implements OnInit {

  /**
   * The Fuel resource to add into a collection.
   */
  public resource: FuelResource;

  /**
   * Collection description to use in the form element.
   */
  public collectionDescription: string;

  /**
   * Input form for the new Collection Name.
   */
  public collectionNameInputForm = new FormControl('',
    {validators: [Validators.required, Validators.pattern('[^\/]*')],
    updateOn: 'change' || 'submit'});

  /**
   * List of potential owners of the collection.
   */
  public collectionOwnerList: string[];

  /**
   * Index of the selected owner from the list. By default, it's the logged user.
   */
  public owner: number = 0;

  /**
   * Input form that handles the collection Name, to add a resource into it.
   */
  public collectionAddInputForm = new FormControl('',
    {updateOn: 'change' || 'submit'});

  /**
   * List of potential Collections to add a resource into. It is an Observable,
   * the HTML subscribes to it using the "async" pipe.
   */
  public collectionList: Observable<Collection[]>;

  /**
   * Form Input for the Model Privacy.
   */
  public privacyInputForm = new FormControl();

  /**
   * Which option (add or create).
   */
  public option = 0;

  /**
   * The set of available options.
   */
  public options = ['Add', 'Create'];

  /**
   * @param collectionService Service used to handle collection-related requests to the Server.
   * @param dialog Reference to the opened dialog.
   * @param snackBar Snackbar used to display notifications.
   * @param data Data for the dialog. Fields:
   *        - ownerList (string[]) Array of potential owners the collection could have.
   *        - resource (FuelResource) The resource that could be added to the collection.
   */
  constructor(
    public collectionService: CollectionService,
    public dialog: MatDialogRef<CollectionDialogComponent>,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.collectionOwnerList = data.ownerList;
      this.resource = data.resource;
  }

  /**
   * On Init lifecycle hook.
   */
  public ngOnInit(): void {
    // Prepare the collection list filter by input.
    this.collectionList = this.collectionAddInputForm.valueChanges.pipe(
      debounceTime(300),
      switchMap((value, index) => {
        // Value is a string until a collection is selected.
        // Once selected, the value is a Collection instead of a string. A collection is useful
        // because we need both name and owner, but we need a string to pass to the search query.
        if (typeof value !== 'string') {
          value = (value as Collection).name;
        }
        return this.collectionService.getCollectionExtensibleList({search: value}).pipe(
          map((paginatedCollections) => {
            return paginatedCollections.collections;
          })
        );
      }));
  }

  /**
   * Callback of the add button. Adds the given Fuel resource to a new collection.
   */
  public add(): void {
    // Verify the input field contains a collection. If none was selected, it is only
    // a string.
    if (!this.collectionAddInputForm.value ||
        typeof this.collectionAddInputForm.value === 'string') {
      return;
    }

    const selectedName = (this.collectionAddInputForm.value as Collection).name;
    const selectedOwner = (this.collectionAddInputForm.value as Collection).owner;

    this.collectionService.addAsset(selectedOwner, selectedName, this.resource).subscribe(
      (response) => {
        this.dialog.close(true);
        this.snackBar.open(
          `${this.resource.name} added to ${selectedName}`,
          'Got it',
          { duration: 2750 });
      },
      (error) => {
        if (error.code === ErrMsg.ErrorResourceExists) {
          this.snackBar.open(`${this.resource.name} is already part of ${selectedName}`,
          'Got it', {duration: 2750});
        } else {
          this.snackBar.open(error.message, 'Got it');
        }
      }
    );
  }

  /**
   * Create a new collection.
   */
  public create(): void {
    // Validate the input fields.
    // Note: The required validator doesn't trim the value of the input.
    this.collectionNameInputForm.setValue(this.collectionNameInputForm.value.trim());
    this.collectionNameInputForm.updateValueAndValidity();

    // Shouldn't create a collection without a name.
    if (this.collectionNameInputForm.value === undefined ||
      this.collectionNameInputForm.value === '') {
      return;
    }

    const data = {
      name: this.collectionNameInputForm.value,
      owner: this.collectionOwnerList[this.owner],
      description: this.collectionDescription,
      private: !!this.privacyInputForm.value
    };

    // Create the Collection.
    this.collectionService.createCollection(data).subscribe(
      (collection) => {
        // Add the resource into the new collection.
        this.collectionService.addAsset(collection.owner, collection.name, this.resource).subscribe(
          (response) => {
            this.dialog.close(true);
            this.snackBar.open(
              `${this.resource.name} added to ${collection.name}`,
              'Got it',
              { duration: 2750 });
          },
          (error) => {
            this.snackBar.open(error.message, 'Got it');
          });
      },
      (error) => {
        if (error.code === ErrMsg.ErrorResourceExists) {
          this.collectionNameInputForm.setErrors({
            duplicated: true
          });
        }
      }
    );
  }

  /**
   * Used by the Material Autoselect, to display the selected collection's name.
   *
   * @param collection The selected collection.
   * @returns The name of the selected collection.
   */
  public getCollectionName(collection?: Collection): string | null {
    return collection ? collection.name : null;
  }

  /**
   * Error message of the Collection Name input field.
   *
   * @returns A string describing the error, or an empty string if there is no error.
   */
  public getCollectionNameError(): string {
    // Empty collection name.
    if (this.collectionNameInputForm.hasError('required')) {
      return 'This field is required';
    }

    // Duplicated collection name.
    if (this.collectionNameInputForm.hasError('duplicated')) {
      return 'This collection already exists. Please use a different name.';
    }

    // No error.
    return '';
  }

  /**
   * Handle form submission.
   */
  public submit(): void {
    if (this.option === 0) {
      this.add();
    } else {
      this.create();
    }
  }

  /**
   * Set the option
   */
  public openOption(index: number): void {
    this.option = index;
  }
}
