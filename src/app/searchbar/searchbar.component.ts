import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../fuel-resource/categories/category.service';
import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../fuel-resource/categories/category';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material';

@Component({
  selector: 'ign-searchbar',
  templateUrl: 'searchbar.component.html',
  styleUrls: ['searchbar.component.scss'],
})

/**
 * Searchbar Component is that allows the user search for models.
 * It includes a category dropdown to filter by categories.
 */
export class SearchbarComponent implements OnInit {
  /**
   * listCategories represents the key-value pairs (slug and name) for the list of categories.
   */
  public listCategories: Map<string, string>;

  /**
   * selectedCategories represents the array of slugs for categories that were selected.
   */
  public selectedCategories: string[];

  /**
   * The Form Control element to handle the selection of categories.
   */
  public categorySelectionForm = new FormControl(this.listCategories);

  /**
   * The filters that are being used in the searchbar.
   * - Categories: 'categories' || 'CATEGORIES'
   */
  @Input()
  public filters: string[] = [];

  /**
   * Show categories filter.
   */
  private showCategories: boolean = false;

  constructor(
    public categoryService: CategoryService,
    private router: Router,
  ) {}

  /**
   * OnInit lifecycle hook.
   */
  public ngOnInit(): void {
    this.populateCategoryList();
    this.setFilters(this.filters);
  }

  /**
   * Event triggered by a change in selection.
   *
   * @param event The Select Change event that contains the new categories.
   */
  public selectionChange(event: MatSelectChange) {
    // Change the categories.
    this.selectedCategories.push(event.value);
  }

  /**
   * categoryKeys returns the array of keys from the list of current categories.
   */
  public categoryKeys(): string[] {
    return Array.from(this.listCategories.keys());
  }

  /**
   * categoryValue returns the value from the list of categories by the given key
   * @param key the element's key that will return
   */
  public categoryValue(key: string): string {
    return this.listCategories.get(key);
  }

  /**
   * Callback when the search button has been pressed.
   *
   * @param search Search string.
   */
  private onSearch(search: string): void {
    this.router.navigate(['search', {q: search, c: this.selectedCategories.join(',')}]);
  }

  /**
   * Parse filters array and set which filters are being shown.
   * @param filters The given array of filters
   */
  private setFilters(filters: string[]): void {
    let filter: string;
    for (filter of filters) {
      switch (filter) {
        case 'categories' || 'CATEGORIES':
          this.showCategories = true;
          break;
      }
    }
  }

  /**
   * Populate the category dropdown with the categories from the API.
   */
  private populateCategoryList(): void {
    this.selectedCategories = [];
    this.listCategories = new Map<string, string>();
    let category: Category;
    this.categoryService.getAll().subscribe(
      (result) => {
        for (category of result) {
          this.listCategories.set(category.slug, category.name);
        }
      }
    );
    this.categorySelectionForm.setValue(Array.from(this.listCategories));
  }
}
