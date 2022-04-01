import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';

import { CategoryService } from '../../fuel-resource/categories/category.service';

@Component({
  selector: 'gz-categories',
  templateUrl: 'categories.component.html',
})

/**
 * The Categories Component is used to display or edit a resource's categories.
 */
export class CategoriesComponent implements OnInit {

  /**
   * The categories this component represents.
   */
  @Input() public categories: string[] = [];

  /**
   * Whether the component is used to edit categories or to display them.
   * While editing, categories can be modified.
   */
  @Input() public edit: boolean = false;

  /**
   * Disables the dropdown field while editing. Useful to prevent a user from modifying the
   * categories when the resource is updating.
   */
  @Input() public set disabled(disable: boolean) {
    // Note: Since the dropdown is controlled with a FormControl element, the enable() and disable()
    // methods are preferred over the disabled attribute of the template element itself.
    if (disable === true) {
      this.categorySelectionForm.disable();
    } else {
      this.categorySelectionForm.enable();
    }
  }

  /**
   * Event emitter when the categories have been modified. Emits the new categories.
   */
  @Output() public onModify = new EventEmitter<string[]>();

  /**
   * Comma-separated string of the selected categories used for display purposes. This allows
   * treating the categories in the template as one text element instead of one per category.
   */
  public selectedCategories: string;

  /**
   * List of available categories the resource can have. Used to edit the categories.
   */
  public availableCategories: string[] = [];

  /**
   * The Form Control element to handle the selection of categories.
   */
  public categorySelectionForm = new FormControl(this.categories);

  /**
   * @param categoryService Service to request available categories
   */
  constructor(
    public categoryService: CategoryService) {
  }

  /**
   * OnInit lifecycle hook.
   */
  public ngOnInit(): void {
    this.selectedCategories = this.categories.join(', ');

    // Get the list of available categories from the backend. This is only required while
    // editing categories.
    if (this.edit) {
      this.categoryService.getAll().subscribe(
        (categories) => {
          this.availableCategories = categories.map((category) => category.name);
        }
      );
    }

    // If editing, then select the categories in the form.
    this.categorySelectionForm.setValue(this.categories);
  }

  /**
   * Event triggered by a change in selection.
   *
   * @param event The Select Change event that contains the new categories.
   */
  public selectionChange(event: MatSelectChange): void {
    // Change the categories.
    this.categories = event.value;

    // Emit the new categories for the parent component to use.
    this.onModify.emit(event.value);
  }
}
