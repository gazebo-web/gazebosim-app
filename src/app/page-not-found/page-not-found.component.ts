import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'gz-page-not-found',
  templateUrl: 'page-not-found.component.html',
  styleUrls: ['page-not-found.component.scss'],
  standalone: true,
  imports: [
    FlexLayoutModule,
  ],
})

/**
 * PageNotFound component is displayed when an invalid route is used.
 */
export class PageNotFoundComponent {
}
