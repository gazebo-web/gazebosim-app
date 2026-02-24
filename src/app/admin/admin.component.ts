import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'gz-admin',
  templateUrl: 'admin.component.html',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatButtonModule,
    RouterModule,
  ],
})

/**
 * Admin Component is the landing page for system admins.
 * From here they can navigate to other sections.
 */
export class AdminComponent {
}
