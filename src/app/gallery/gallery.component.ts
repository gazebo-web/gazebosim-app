import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwiperModule } from 'swiper/angular';
import { SafeUrl } from '@angular/platform-browser';

import SwiperCore, {FreeMode, Navigation, Thumbs, SwiperOptions} from 'swiper';
SwiperCore.use([FreeMode, Navigation, Thumbs]);

/**
 * The Gallery Component encapsulates Swiper.
 * Receives the gallery images as an input.
 */
@Component({
  selector: 'gz-gallery',
  standalone: true,
  imports: [
    CommonModule,
    SwiperModule,
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss', './swiper.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GalleryComponent implements OnChanges {
  /**
   * The gallery images.
   */
  @Input() public images: SafeUrl[];

  /**
   * A reference to the thumbnail slider, to be used by the main slider.
   * It is changed by events in the thumbnail slider.
   */
  public thumbsSwiper: SwiperCore;

  /**
   * Configuration of the main slider.
   */
  public mainConfig: SwiperOptions = {
    spaceBetween: 0,
    navigation: true,
  };

  /**
   * Configuration of the thumbnails slider.
   */
  public thumbsConfig: SwiperOptions = {
    spaceBetween: 0,
    freeMode: true,
  };

  /**
   * OnChanges Lifecycle hook.
   * Reacts to changes of the images.
   *
   * @param changes Input changes of the component.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if ('images' in changes) {
      this.images = changes['images'].currentValue as SafeUrl[];
      console.log(this.images);
      this.thumbsConfig.slidesPerView = this.images ? this.images.length : 0;
    }
  }
}
