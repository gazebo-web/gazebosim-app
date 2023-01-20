import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gz-page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
  ],
})

/**
 * The Page Title Component is a visual component that allows setting a title with an optional icon.
 */
export class PageTitleComponent {

  /**
   * The title to display.
   */
  @Input() public title: string;

  /**
   * Optional SVG icon.
   *
   * SVG icons require a different treatment to be displayed with the Material Design's Icon
   * Module. They also need to be added in the App Module's constructor.
   */
  @Input() public svgIcon: string;

  /**
   * Optional Material Icon.
   *
   * These are the default icons provided by Material Design.
   */
  @Input() public icon: string;
}
