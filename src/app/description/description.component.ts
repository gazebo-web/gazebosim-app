import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'gz-description',
  templateUrl: 'description.component.html',
  styleUrls: ['description.component.scss']
})

/**
 * The Description Component is used to display a description text field in Markdown,
 * or to edit it, allowing the user to preview their input in Markdown.
 */
export class DescriptionComponent {

  /**
   * The description to display or edit.
   */
  @Input() public description: string = '';

  /**
   * Enable the edit mode. Allows the text input and markdown preview button.
   */
  @Input() public edit: boolean = false;

  /**
   * Disables the input fields. Used on the edit mode.
   */
  @Input() public disabled: boolean = false;

  /**
   * Event emitter when the description has been modified.
   */
  @Output() public onModify = new EventEmitter<string>();

  /**
   * Toggle between the preview and edit buttons.
   */
  public markdownPreview: boolean = false;

  /**
   * Callback whenever the description field is modified.
   * Emits an event containing the new description.
   *
   * @param description The modified description.
   */
  public setDescription(description: string): void {
    this.description = description;
    this.onModify.emit(description);
  }

  /**
   * Toggle the Markdown Preview.
   */
  public toggleMarkdownPreview(): void {
    this.markdownPreview = !this.markdownPreview;
  }
}
