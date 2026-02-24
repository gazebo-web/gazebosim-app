import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';

import { SafeUrl } from '@angular/platform-browser';

/**
 * The Gallery Component displays a simple image gallery with thumbnail navigation.
 * Replaces the previous Swiper-based implementation (swiper/angular is incompatible with Angular 21).
 * Receives the gallery images as an input.
 */
@Component({
  selector: 'gz-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class GalleryComponent implements OnChanges {
  /**
   * The gallery images.
   */
  @Input() public images: SafeUrl[];

  /**
   * The index of the currently displayed image.
   */
  public currentIndex: number = 0;

  /**
   * OnChanges Lifecycle hook.
   * Reacts to changes of the images.
   *
   * @param changes Input changes of the component.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if ('images' in changes) {
      this.images = changes['images'].currentValue as SafeUrl[];
      this.currentIndex = 0;
    }
  }

  /**
   * Navigate to the previous image.
   */
  public prev(): void {
    if (this.images && this.images.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    }
  }

  /**
   * Navigate to the next image.
   */
  public next(): void {
    if (this.images && this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  /**
   * Select a specific image by index.
   */
  public selectImage(index: number): void {
    this.currentIndex = index;
  }
}
