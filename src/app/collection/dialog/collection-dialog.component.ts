import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { map } from "rxjs/operators";

import { Collection } from "../collection";
import { CollectionService } from "../collection.service";
import { ErrMsg } from "../../server/err-msg";
import { FuelResource } from "../../fuel-resource";

@Component({
  selector: "gz-collection-dialog",
  templateUrl: "collection-dialog.component.html",
  styleUrls: ["collection-dialog.component.scss"],
  standalone: false,
})

/**
 * Quick-picker dialog to add a resource into an existing or new Collection.
 */
export class CollectionDialogComponent implements OnInit {
  /**
   * The Fuel resource to add into a collection.
   */
  public resource: FuelResource;

  /**
   * Input form for the new Collection Name.
   */
  public collectionNameInputForm = new FormControl("", {
    validators: [Validators.required, Validators.pattern("[^\/]*")],
    updateOn: "change",
  });

  /**
   * List of potential owners of the collection.
   */
  public collectionOwnerList: string[];

  /**
   * All collections the user can extend.
   */
  public extensibleCollections: Collection[] = [];

  /**
   * Filtered collections based on search text.
   */
  public filteredCollections: Collection[] = [];

  /**
   * The current search text.
   */
  public searchText: string = "";

  /**
   * Whether the collection list is still loading.
   */
  public loadingCollections: boolean = true;

  /**
   * The currently selected existing collection.
   */
  public selectedCollection: Collection | null = null;

  /**
   * Whether the user is creating a new collection.
   */
  public creatingNew: boolean = false;

  /**
   * Whether the new collection should be private.
   */
  public isPrivate: boolean = false;

  /**
   * Whether an operation is in progress.
   */
  public busy: boolean = false;

  /**
   * Reference to the new collection name input for auto-focus.
   */
  @ViewChild("newNameInput") newNameInput: ElementRef;

  constructor(
    public collectionService: CollectionService,
    public dialog: MatDialogRef<CollectionDialogComponent>,
    public snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.collectionOwnerList = data.ownerList;
    this.resource = data.resource;
  }

  public ngOnInit(): void {
    this.collectionService
      .getCollectionExtensibleList({})
      .pipe(map((paginated) => paginated.collections))
      .subscribe({
        next: (collections) => {
          this.extensibleCollections = collections;
          this.filteredCollections = collections;
          this.loadingCollections = false;
        },
        error: () => {
          this.loadingCollections = false;
        },
      });
  }

  /**
   * Filter the collection list by search text.
   */
  public filterCollections(text: string): void {
    const query = text.toLowerCase();
    this.filteredCollections = this.extensibleCollections.filter(
      (col) =>
        col.name.toLowerCase().includes(query) ||
        col.owner.toLowerCase().includes(query),
    );
  }

  /**
   * Select an existing collection.
   */
  public selectCollection(collection: Collection): void {
    this.selectedCollection = collection;
    this.creatingNew = false;
  }

  /**
   * Activate the create-new inline input.
   */
  public activateCreate(): void {
    this.creatingNew = true;
    this.selectedCollection = null;
    setTimeout(() => {
      if (this.newNameInput) {
        this.newNameInput.nativeElement.focus();
      }
    });
  }

  /**
   * Toggle the privacy setting for a new collection.
   */
  public togglePrivacy(): void {
    this.isPrivate = !this.isPrivate;
  }

  /**
   * Whether the Add button should be enabled.
   */
  public canSubmit(): boolean {
    if (this.creatingNew) {
      return (
        this.collectionNameInputForm.valid &&
        this.collectionNameInputForm.value.trim() !== ""
      );
    }
    return this.selectedCollection !== null;
  }

  /**
   * Handle the Add button: either add to selected or create-then-add.
   */
  public submit(): void {
    if (this.busy) {
      return;
    }
    if (this.creatingNew) {
      this.create();
    } else if (this.selectedCollection) {
      this.add();
    }
  }

  /**
   * Add the resource to the selected existing collection.
   */
  private add(): void {
    this.busy = true;
    const col = this.selectedCollection;

    this.collectionService
      .addAsset(col.owner, col.name, this.resource)
      .subscribe(
        (response) => {
          this.dialog.close(true);
          this.snackBar.open(
            `${this.resource.name} added to ${col.name}`,
            "Got it",
            { duration: 2750 },
          );
        },
        (error) => {
          this.busy = false;
          if (error.code === ErrMsg.ErrorResourceExists) {
            this.snackBar.open(
              `${this.resource.name} is already part of ${col.name}`,
              "Got it",
              { duration: 2750 },
            );
          } else {
            this.snackBar.open(error.message, "Got it");
          }
        },
      );
  }

  /**
   * Create a new collection and add the resource to it.
   */
  private create(): void {
    this.collectionNameInputForm.setValue(
      this.collectionNameInputForm.value.trim(),
    );
    this.collectionNameInputForm.updateValueAndValidity();

    if (
      this.collectionNameInputForm.value === undefined ||
      this.collectionNameInputForm.value === ""
    ) {
      return;
    }

    this.busy = true;

    const data = {
      name: this.collectionNameInputForm.value,
      owner: this.collectionOwnerList[0],
      description: "",
      private: this.isPrivate,
    };

    this.collectionService.createCollection(data).subscribe(
      (collection) => {
        this.collectionService
          .addAsset(collection.owner, collection.name, this.resource)
          .subscribe(
            (response) => {
              this.dialog.close(true);
              this.snackBar.open(
                `${this.resource.name} added to ${collection.name}`,
                "Got it",
                { duration: 2750 },
              );
            },
            (error) => {
              this.busy = false;
              this.snackBar.open(error.message, "Got it");
            },
          );
      },
      (error) => {
        this.busy = false;
        if (error.code === ErrMsg.ErrorResourceExists) {
          this.collectionNameInputForm.setErrors({
            duplicated: true,
          });
        }
      },
    );
  }

  /**
   * Error message of the Collection Name input field.
   */
  public getCollectionNameError(): string {
    if (this.collectionNameInputForm.hasError("required")) {
      return "This field is required";
    }

    if (this.collectionNameInputForm.hasError("duplicated")) {
      return "This collection already exists. Please use a different name.";
    }

    return "";
  }
}
