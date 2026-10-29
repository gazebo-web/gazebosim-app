import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { RouterLink, provideRouter } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";

import { AuthPipe } from "../auth/auth.pipe";
import { AuthService } from "../auth/auth.service";
import { ItemCardComponent } from "./item-card.component";

describe("ItemCardComponent", () => {
  let fixture: ComponentFixture<ItemCardComponent>;
  let component: ItemCardComponent;

  // A resource without thumbnails, so no image request is made.
  const testResource = {
    name: "test-model",
    owner: "test-owner",
    hasThumbnail: () => false,
  };

  /**
   * Set the inputs and run change detection, as a parent template would.
   */
  function render(compact: boolean, removable: boolean): void {
    fixture.componentRef.setInput("compact", compact);
    fixture.componentRef.setInput("removable", removable);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatCardModule, MatIconModule, RouterLink],
      declarations: [AuthPipe, ItemCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(ItemCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("resource", testResource);
    fixture.componentRef.setInput("type", "models");
  });

  it("should not be compact by default", () => {
    fixture.detectChanges();

    expect(component.compact).toBe(false);
    expect(fixture.nativeElement.classList).not.toContain("compact");
    expect(
      fixture.nativeElement.querySelector("mat-card-actions"),
    ).toBeTruthy();
  });

  it("should add the compact class and hide the empty actions bar", () => {
    render(true, false);

    expect(fixture.nativeElement.classList).toContain("compact");
    expect(fixture.nativeElement.querySelector("mat-card-actions")).toBeNull();
  });

  it("should keep the remove button on compact removable cards", () => {
    render(true, true);

    expect(
      fixture.nativeElement.querySelector("mat-card-actions button"),
    ).toBeTruthy();
  });

  it("should accept the compact attribute without a value", () => {
    fixture.componentRef.setInput("compact", "");
    fixture.detectChanges();

    expect(component.compact).toBe(true);
  });
});
