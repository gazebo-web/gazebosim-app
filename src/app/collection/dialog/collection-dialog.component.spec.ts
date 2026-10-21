import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { RouterTestingModule } from "@angular/router/testing";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { of, throwError } from "rxjs";

import { Collection } from "../collection";
import { CollectionDialogComponent } from "./collection-dialog.component";
import { CollectionService } from "../collection.service";
import { ErrMsg } from "../../server/err-msg";
import { JsonClassFactoryService } from "../../factory/json-class-factory.service";
import { Model } from "../../model/model";
import { PaginatedCollection } from "../paginated-collection";

describe("CollectionDialogComponent", () => {
  let fixture: ComponentFixture<CollectionDialogComponent>;
  let component: CollectionDialogComponent;
  let service: CollectionService;

  const mockCollectionData = {
    name: "testCollection",
    owner: "testOwner",
    description: "",
    private: false,
  };
  const mockCollection = new Collection(mockCollectionData);
  const secondCollectionData = {
    name: "robotModels",
    owner: "testOwner",
    description: "",
    private: false,
  };
  const secondCollection = new Collection(secondCollectionData);
  const thirdCollectionData = {
    name: "droneAssets",
    owner: "otherUser",
    description: "",
    private: true,
  };
  const thirdCollection = new Collection(thirdCollectionData);
  const mockResource = new Model({});

  beforeEach(() => {
    const paginatedResult = new PaginatedCollection();
    paginatedResult.collections = [
      mockCollection,
      secondCollection,
      thirdCollection,
    ];
    paginatedResult.totalCount = 3;

    TestBed.configureTestingModule({
      declarations: [CollectionDialogComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatDialogModule,
        MatIconModule,
        MatInputModule,
        MatSnackBarModule,
        MatTooltipModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      providers: [
        CollectionService,
        JsonClassFactoryService,
        {
          provide: MAT_DIALOG_DATA,
          useValue: { ownerList: ["testOwner"], resource: mockResource },
        },
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy("close") },
        },
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });

    fixture = TestBed.createComponent(CollectionDialogComponent);
    component = fixture.debugElement.componentInstance;
    service = component.collectionService;
  });

  // --- Initial state ---

  describe("initial state", () => {
    it("should create the component", () => {
      expect(component).toBeTruthy();
    });

    it("should start with no selection and not in create mode", () => {
      expect(component.selectedCollection).toBeNull();
      expect(component.creatingNew).toBe(false);
      expect(component.busy).toBe(false);
      expect(component.isPrivate).toBe(false);
      expect(component.searchText).toBe("");
    });

    it("should start with loading state", () => {
      expect(component.loadingCollections).toBe(true);
    });

    it("should not allow submit initially", () => {
      expect(component.canSubmit()).toBe(false);
    });

    it("should set resource and ownerList from dialog data", () => {
      expect(component.resource).toBe(mockResource);
      expect(component.collectionOwnerList).toEqual(["testOwner"]);
    });
  });

  // --- ngOnInit ---

  describe("ngOnInit", () => {
    it("should load extensible collections on init", () => {
      const paginated = new PaginatedCollection();
      paginated.collections = [mockCollection, secondCollection];
      paginated.totalCount = 2;
      spyOn(service, "getCollectionExtensibleList").and.returnValue(
        of(paginated),
      );

      component.ngOnInit();

      expect(service.getCollectionExtensibleList).toHaveBeenCalledWith({});
      expect(component.extensibleCollections).toEqual([
        mockCollection,
        secondCollection,
      ]);
      expect(component.filteredCollections).toEqual([
        mockCollection,
        secondCollection,
      ]);
      expect(component.loadingCollections).toBe(false);
    });

    it("should handle error when loading collections", () => {
      spyOn(service, "getCollectionExtensibleList").and.returnValue(
        throwError("error"),
      );

      component.ngOnInit();

      expect(component.loadingCollections).toBe(false);
      expect(component.extensibleCollections).toEqual([]);
    });
  });

  // --- Selecting a collection ---

  describe("selectCollection", () => {
    it("should select a collection", () => {
      component.selectCollection(mockCollection);

      expect(component.selectedCollection).toBe(mockCollection);
      expect(component.creatingNew).toBe(false);
    });

    it("should exit create mode when selecting a collection", () => {
      component.activateCreate();
      expect(component.creatingNew).toBe(true);

      component.selectCollection(mockCollection);
      expect(component.creatingNew).toBe(false);
      expect(component.selectedCollection).toBe(mockCollection);
    });

    it("should allow changing the selected collection", () => {
      component.selectCollection(mockCollection);
      expect(component.selectedCollection).toBe(mockCollection);

      component.selectCollection(secondCollection);
      expect(component.selectedCollection).toBe(secondCollection);
    });

    it("should enable submit when a collection is selected", () => {
      expect(component.canSubmit()).toBe(false);

      component.selectCollection(mockCollection);
      expect(component.canSubmit()).toBe(true);
    });
  });

  // --- Create mode ---

  describe("activateCreate", () => {
    it("should enter create mode", () => {
      component.activateCreate();

      expect(component.creatingNew).toBe(true);
      expect(component.selectedCollection).toBeNull();
    });

    it("should clear selection when entering create mode", () => {
      component.selectCollection(mockCollection);
      expect(component.selectedCollection).toBe(mockCollection);

      component.activateCreate();
      expect(component.selectedCollection).toBeNull();
    });

    it("should not allow submit in create mode without a name", () => {
      component.activateCreate();
      component.collectionNameInputForm.setValue("");

      expect(component.canSubmit()).toBe(false);
    });

    it("should not allow submit in create mode with only whitespace", () => {
      component.activateCreate();
      component.collectionNameInputForm.setValue("   ");

      expect(component.canSubmit()).toBe(false);
    });

    it("should allow submit in create mode with a valid name", () => {
      component.activateCreate();
      component.collectionNameInputForm.setValue("My Collection");

      expect(component.canSubmit()).toBe(true);
    });
  });

  // --- Privacy toggle ---

  describe("togglePrivacy", () => {
    it("should toggle between public and private", () => {
      expect(component.isPrivate).toBe(false);

      component.togglePrivacy();
      expect(component.isPrivate).toBe(true);

      component.togglePrivacy();
      expect(component.isPrivate).toBe(false);
    });
  });

  // --- Search / filter ---

  describe("filterCollections", () => {
    beforeEach(() => {
      component.extensibleCollections = [
        mockCollection,
        secondCollection,
        thirdCollection,
      ];
    });

    it("should show all collections for empty search", () => {
      component.filterCollections("");

      expect(component.filteredCollections.length).toBe(3);
    });

    it("should filter by collection name", () => {
      component.filterCollections("robot");

      expect(component.filteredCollections.length).toBe(1);
      expect(component.filteredCollections[0].name).toBe("robotModels");
    });

    it("should filter by owner name", () => {
      component.filterCollections("otherUser");

      expect(component.filteredCollections.length).toBe(1);
      expect(component.filteredCollections[0].name).toBe("droneAssets");
    });

    it("should be case-insensitive", () => {
      component.filterCollections("DRONE");

      expect(component.filteredCollections.length).toBe(1);
      expect(component.filteredCollections[0].name).toBe("droneAssets");
    });

    it("should return no results for non-matching search", () => {
      component.filterCollections("zzzzz");

      expect(component.filteredCollections.length).toBe(0);
    });

    it("should match partial strings", () => {
      component.filterCollections("test");

      expect(component.filteredCollections.length).toBe(2);
    });
  });

  // --- Submit: add to existing ---

  describe("submit (add to existing)", () => {
    it("should add resource to selected collection and close", () => {
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.selectCollection(mockCollection);

      component.submit();

      expect(service.addAsset).toHaveBeenCalledWith(
        mockCollection.owner,
        mockCollection.name,
        mockResource,
      );
      expect(component.dialog.close).toHaveBeenCalledWith(true);
    });

    it("should not submit when busy", () => {
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.selectCollection(mockCollection);
      component.busy = true;

      component.submit();

      expect(service.addAsset).not.toHaveBeenCalled();
    });

    it("should not submit without a selection", () => {
      spyOn(service, "addAsset").and.returnValue(of({}));

      component.submit();

      expect(service.addAsset).not.toHaveBeenCalled();
    });

    it("should show snackbar when resource already exists in collection", () => {
      spyOn(service, "addAsset").and.returnValue(
        throwError({ code: ErrMsg.ErrorResourceExists }),
      );
      spyOn(component.snackBar, "open");
      component.resource = mockResource;
      component.selectCollection(mockCollection);

      component.submit();

      expect(component.snackBar.open).toHaveBeenCalled();
      expect(component.busy).toBe(false);
    });

    it("should show error snackbar on generic add failure", () => {
      spyOn(service, "addAsset").and.returnValue(
        throwError({ message: "Server error" }),
      );
      spyOn(component.snackBar, "open");
      component.resource = mockResource;
      component.selectCollection(mockCollection);

      component.submit();

      expect(component.snackBar.open).toHaveBeenCalledWith(
        "Server error",
        "Got it",
      );
      expect(component.busy).toBe(false);
    });

    it("should set busy to true during add", () => {
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.selectCollection(mockCollection);

      // Check busy is set before observable completes
      const originalSubscribe = service.addAsset(
        "",
        "",
        mockResource,
      ).subscribe;
      expect(component.busy).toBe(false);

      component.submit();

      // After synchronous observable resolves, dialog closes
      expect(component.dialog.close).toHaveBeenCalledWith(true);
    });
  });

  // --- Submit: create new ---

  describe("submit (create new)", () => {
    it("should create collection, add resource, and close", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("testCollection");

      component.submit();

      expect(service.createCollection).toHaveBeenCalledWith(mockCollectionData);
      expect(service.addAsset).toHaveBeenCalledWith(
        mockCollection.owner,
        mockCollection.name,
        mockResource,
      );
      expect(component.dialog.close).toHaveBeenCalledWith(true);
    });

    it("should create a private collection when toggled", () => {
      const privateCollection = new Collection({
        ...mockCollectionData,
        private: true,
      });
      spyOn(service, "createCollection").and.returnValue(of(privateCollection));
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.togglePrivacy();
      component.collectionNameInputForm.setValue("testCollection");

      component.submit();

      expect(service.createCollection).toHaveBeenCalledWith({
        name: "testCollection",
        owner: "testOwner",
        description: "",
        private: true,
      });
    });

    it("should not create if the name is empty", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("");

      component.submit();

      expect(service.createCollection).not.toHaveBeenCalled();
    });

    it("should not create if the name is only whitespace", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("   ");

      component.submit();

      expect(service.createCollection).not.toHaveBeenCalled();
    });

    it("should trim whitespace from name before creating", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("  myCollection  ");

      component.submit();

      expect(service.createCollection).toHaveBeenCalledWith({
        name: "myCollection",
        owner: "testOwner",
        description: "",
        private: false,
      });
    });

    it("should set duplicated error on name conflict", () => {
      spyOn(service, "createCollection").and.returnValue(
        throwError({ code: ErrMsg.ErrorResourceExists }),
      );
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("testCollection");

      component.submit();

      expect(component.collectionNameInputForm.hasError("duplicated")).toBe(
        true,
      );
      expect(component.busy).toBe(false);
    });

    it("should show error snackbar when addAsset fails after create", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      spyOn(service, "addAsset").and.returnValue(
        throwError({ message: "Add failed" }),
      );
      spyOn(component.snackBar, "open");
      component.resource = mockResource;
      component.collectionOwnerList = ["testOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("testCollection");

      component.submit();

      expect(component.snackBar.open).toHaveBeenCalledWith(
        "Add failed",
        "Got it",
      );
      expect(component.busy).toBe(false);
    });

    it("should use first owner from ownerList", () => {
      spyOn(service, "createCollection").and.returnValue(of(mockCollection));
      spyOn(service, "addAsset").and.returnValue(of({}));
      component.resource = mockResource;
      component.collectionOwnerList = ["firstOwner", "secondOwner"];

      component.activateCreate();
      component.collectionNameInputForm.setValue("newCol");

      component.submit();

      expect(service.createCollection).toHaveBeenCalledWith(
        jasmine.objectContaining({ owner: "firstOwner" }),
      );
    });
  });

  // --- Error messages ---

  describe("getCollectionNameError", () => {
    it("should return required error message", () => {
      component.collectionNameInputForm.setErrors({ required: true });

      expect(component.getCollectionNameError()).toBe("This field is required");
    });

    it("should return duplicated error message", () => {
      component.collectionNameInputForm.setErrors({ duplicated: true });

      expect(component.getCollectionNameError()).toBe(
        "This collection already exists. Please use a different name.",
      );
    });

    it("should return empty string when no errors", () => {
      component.collectionNameInputForm.setErrors({});

      expect(component.getCollectionNameError()).toBe("");
    });
  });
});
