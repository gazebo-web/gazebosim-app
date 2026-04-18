import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SimpleChange } from "@angular/core";
import { SafeUrl } from "@angular/platform-browser";

import { GalleryComponent } from "./gallery.component";

describe("GalleryComponent", () => {
  let fixture: ComponentFixture<GalleryComponent>;
  let component: GalleryComponent;

  // Mock SafeUrl images.
  const mockImages: SafeUrl[] = [
    "image-url-0" as any,
    "image-url-1" as any,
    "image-url-2" as any,
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GalleryComponent],
    });

    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.debugElement.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize currentIndex to 0", () => {
    expect(component.currentIndex).toBe(0);
  });

  it("should reset currentIndex to 0 when images input changes", () => {
    component.currentIndex = 2;
    component.ngOnChanges({
      images: new SimpleChange(null, mockImages, true),
    });
    expect(component.images).toEqual(mockImages);
    expect(component.currentIndex).toBe(0);
  });

  it("should not reset currentIndex when a non-images input changes", () => {
    component.images = mockImages;
    component.currentIndex = 2;
    component.ngOnChanges({
      someOtherInput: new SimpleChange(null, "value", true),
    });
    expect(component.currentIndex).toBe(2);
  });

  it("should navigate to the next image", () => {
    component.images = mockImages;
    component.currentIndex = 0;

    component.next();
    expect(component.currentIndex).toBe(1);

    component.next();
    expect(component.currentIndex).toBe(2);
  });

  it("should wrap around to the first image when navigating next from the last", () => {
    component.images = mockImages;
    component.currentIndex = 2;

    component.next();
    expect(component.currentIndex).toBe(0);
  });

  it("should navigate to the previous image", () => {
    component.images = mockImages;
    component.currentIndex = 2;

    component.prev();
    expect(component.currentIndex).toBe(1);

    component.prev();
    expect(component.currentIndex).toBe(0);
  });

  it("should wrap around to the last image when navigating prev from the first", () => {
    component.images = mockImages;
    component.currentIndex = 0;

    component.prev();
    expect(component.currentIndex).toBe(2);
  });

  it("should not change currentIndex when prev is called with no images", () => {
    component.images = [];
    component.currentIndex = 0;

    component.prev();
    expect(component.currentIndex).toBe(0);
  });

  it("should not change currentIndex when next is called with no images", () => {
    component.images = [];
    component.currentIndex = 0;

    component.next();
    expect(component.currentIndex).toBe(0);
  });

  it("should not change currentIndex when prev is called with null images", () => {
    component.images = null;
    component.currentIndex = 0;

    component.prev();
    expect(component.currentIndex).toBe(0);
  });

  it("should not change currentIndex when next is called with null images", () => {
    component.images = null;
    component.currentIndex = 0;

    component.next();
    expect(component.currentIndex).toBe(0);
  });

  it("should select a specific image by index", () => {
    component.images = mockImages;
    component.currentIndex = 0;

    component.selectImage(2);
    expect(component.currentIndex).toBe(2);

    component.selectImage(1);
    expect(component.currentIndex).toBe(1);

    component.selectImage(0);
    expect(component.currentIndex).toBe(0);
  });

  it("should handle a single image correctly with next and prev", () => {
    component.images = ["single-image" as any];
    component.currentIndex = 0;

    component.next();
    expect(component.currentIndex).toBe(0);

    component.prev();
    expect(component.currentIndex).toBe(0);
  });
});
