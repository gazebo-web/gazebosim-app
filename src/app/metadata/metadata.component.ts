import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { Metadatum } from './metadatum';

@Component({
  selector: 'gz-metadata',
  templateUrl: 'metadata.component.html',
  styleUrls: ['metadata.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    ReactiveFormsModule,
  ],
})

/**
 * The Metadata Component is used to display or edit metadata.
 *
 * Notes:
 *  - In order to clear metadata for a resource, send a single
 *    {key: '', value: ''} to the server.
 */
export class MetadataComponent implements OnInit {

  /**
   * The metadata this component represents.
   */
  @Input() public metadata: Metadatum[] = [];

  /**
   * Enable the edit mode. Allows input and removal of metadata.
   */
  @Input() public edit: boolean = false;

  /**
   * Disables the input fields. Used on the edit mode.
   */
  @Input() public disabled: boolean = false;

  /**
   * Event emitter when the metadata have been modified.
   */
  @Output() public onModify = new EventEmitter<boolean>();

  /**
   * Columns of the leader board.
   */
  public displayedColumns: string[] = ['key', 'value'];

  /**
   * Data source for the leader board's Material Table.
   */
  public dataSource: MatTableDataSource<Metadatum>;

  public ngOnInit(): void {
    if (this.edit && this.metadata.length === 0) {
      this.metadata.push(new Metadatum());
    } else if (!this.edit) {
      this.dataSource = new MatTableDataSource(this.metadata);
    }
  }

  /**
   * Add a new key-value pair.
   */
  public add(): void {
    this.metadata.push(new Metadatum());
    this.onModify.emit(true);
  }

  /**
   * Remove an existing key-value pair.
   */
  public clear(i): void {
    // Remove the item
    this.metadata.splice(i, 1);

    // Add a blank item, if the last item was removed.
    if (this.metadata.length <= 0) {
      const meta = new Metadatum();
      this.metadata.push(meta);
    }

    this.onModify.emit(true);
  }
}
