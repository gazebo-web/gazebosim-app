import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

declare const SwaggerUIBundle: any;

@Component({
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
  selector: 'gz-information',
  templateUrl: 'information.component.html',
  styleUrls: ['information.component.scss']
})

/**
 * Information Component contains documentation about the Gazebo App.
 */
export class InformationComponent {
}
