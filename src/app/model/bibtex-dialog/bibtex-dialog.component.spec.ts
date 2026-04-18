import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import {
  BibtexDialogComponent,
  BibtexDialogData,
} from "./bibtex-dialog.component";

describe("BibtexDialogComponent", () => {
  let fixture: ComponentFixture<BibtexDialogComponent>;
  let component: BibtexDialogComponent;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<BibtexDialogComponent>>;

  const testBibtex =
    "@online{GazeboFuel-test-owner-test-model,\n" +
    "\ttitle={test-model},\n" +
    "\torganization={Open Robotics},\n" +
    "\tdate={2024},\n" +
    "\tauthor={test-owner},\n" +
    "\turl={https://fuel.gazebosim.org/test-owner/models/test-model},\n}";

  const testData: BibtexDialogData = {
    bibtex: testBibtex,
  };

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatSnackBarModule,
      ],
      declarations: [BibtexDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: testData },
      ],
    });

    fixture = TestBed.createComponent(BibtexDialogComponent);
    component = fixture.debugElement.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should receive the bibtex data from MAT_DIALOG_DATA", () => {
    expect(component.data.bibtex).toBe(testBibtex);
  });

  it("should copy the bibtex to the clipboard and show a snackbar", () => {
    const snackBar = TestBed.inject(MatSnackBar);
    spyOn(snackBar, "open");
    spyOn(document, "execCommand");

    component.copy();

    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(snackBar.open).toHaveBeenCalledWith(
      "BibTeX copied to clipboard.",
      "",
      { duration: 2000 },
    );
  });

  it("should close the dialog when close is called", () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
