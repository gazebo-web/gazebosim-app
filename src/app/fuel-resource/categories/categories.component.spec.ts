import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule, MatSelectChange } from "@angular/material/select";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";

import { CategoriesComponent } from "./categories.component";
import { CategoryService } from "./category.service";
import { JsonClassFactoryService } from "../../factory/json-class-factory.service";

describe("CategoriesComponent", () => {
  let fixture: ComponentFixture<CategoriesComponent>;
  let component: CategoriesComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatChipsModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
      ],
      declarations: [CategoriesComponent],
      providers: [
        CategoryService,
        JsonClassFactoryService,
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });

    fixture = TestBed.createComponent(CategoriesComponent);
    component = fixture.debugElement.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize selectedCategories as a comma-separated string", () => {
    component.categories = ["Vehicles", "Robots"];
    component.ngOnInit();
    expect(component.selectedCategories).toBe("Vehicles, Robots");
  });

  it("should initialize selectedCategories as empty string when no categories", () => {
    component.categories = [];
    component.ngOnInit();
    expect(component.selectedCategories).toBe("");
  });

  it("should set the form control value to categories on init", () => {
    component.categories = ["Vehicles"];
    component.ngOnInit();
    expect(component.categorySelectionForm.value).toEqual(["Vehicles"]);
  });

  it("should fetch available categories from the service when in edit mode", () => {
    const categoryService = TestBed.inject(CategoryService);
    const mockCategories = [
      { name: "Vehicles", slug: "vehicles" },
      { name: "Robots", slug: "robots" },
    ];
    spyOn(categoryService, "getAll").and.returnValue(of(mockCategories as any));

    component.edit = true;
    component.categories = [];
    component.ngOnInit();

    expect(categoryService.getAll).toHaveBeenCalled();
    expect(component.availableCategories).toEqual(["Vehicles", "Robots"]);
  });

  it("should NOT fetch available categories when not in edit mode", () => {
    const categoryService = TestBed.inject(CategoryService);
    spyOn(categoryService, "getAll");

    component.edit = false;
    component.categories = [];
    component.ngOnInit();

    expect(categoryService.getAll).not.toHaveBeenCalled();
  });

  it("should emit new categories on selection change", () => {
    spyOn(component.onModify, "emit");

    const mockEvent = {
      value: ["Vehicles", "Robots"],
    } as MatSelectChange;

    component.selectionChange(mockEvent);

    expect(component.categories).toEqual(["Vehicles", "Robots"]);
    expect(component.onModify.emit).toHaveBeenCalledWith([
      "Vehicles",
      "Robots",
    ]);
  });

  it("should disable the form control when disabled is set to true", () => {
    component.disabled = true;
    expect(component.categorySelectionForm.disabled).toBe(true);
  });

  it("should enable the form control when disabled is set to false", () => {
    component.disabled = true;
    expect(component.categorySelectionForm.disabled).toBe(true);

    component.disabled = false;
    expect(component.categorySelectionForm.enabled).toBe(true);
  });
});
