import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'gz-extra-dialog',
  templateUrl: 'extra-dialog.component.html',
  styleUrls: ['extra-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatIconModule,
    MatListModule,
  ],
})

/**
 * The Extra Dialog is used to show information about an specific simulation
 */
export class ExtraDialogComponent {

  /**
   * @param dialog Reference to the opened dialog.
   * @param data Data for the dialog. Fields:
   *
   *        - name (string) Simulation name.
   *        - owner (string) Owner name.
   *        - groupId (string) Simulation group id.
   *        - status (string) Simulation's status.
   *        - circuit (string) Circuit name.
   *        - robots (array) Robots list.
   */
  constructor(
    public dialog: MatDialogRef<ExtraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}
