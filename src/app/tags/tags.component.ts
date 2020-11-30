import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

@Component({
  selector: 'ign-tags',
  templateUrl: 'tags.component.html',
  styleUrls: ['tags.component.scss']
})

/**
 * The Tags Component is used to display or edit tags.
 */
export class TagsComponent {

  /**
   * The tags this component represents.
   */
  @Input() public tags: string[] = [];

  /**
   * Enable the edit mode. Allows input and removal of tags.
   */
  @Input() public edit: boolean = false;

  /**
   * Disables the input fields. Used on the edit mode.
   */
  @Input() public disabled: boolean = false;

  /**
   * Event emitter when the tags have been modified.
   */
  @Output() public onModify = new EventEmitter<boolean>();

  /**
   * List of separators for the input of tags.
   */
  public separatorKeysCodes = [ENTER, COMMA];

  /**
   * Converts a tag to a Chip.
   *
   * @param event Event fired by the chip input list when it receives an end
   * character.
   */
  public addTagChip(event: MatChipInputEvent): void {
    if (this.edit) {
      // Add the new tag to the list.
      const value = event.value;
      if (value && value.trim()) {
        this.tags.push(value.trim());
        this.onModify.emit(true);
      }

      // Clear the input field.
      event.input.value = '';
    }
  }

  /**
   * Removes a tag by its index, when the Chip's delete button is clicked.
   *
   * @param index The index of the tag to remove.
   */
  public removeTag(index: number): void {
    if (this.edit) {
      if (index >= 0) {
        this.tags.splice(index, 1);
        this.onModify.emit(true);
      }
    }
  }

  /**
   * Closes a tag when the input loses focus.
   *
   * @param event Event fired by the blur event.
   */
  public closeTagOnBlur(event: FocusEvent): void {
    if (this.edit) {
      const input = event.target as HTMLInputElement;
      const value = input.value;
      // A MatChipInputEvent is an interface that requires the input element
      // and its value.
      this.addTagChip({input, value});
    }
  }
}
