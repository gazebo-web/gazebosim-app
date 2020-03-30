import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../fuel-resource/categories/category.service';
import { Component, OnInit } from '@angular/core';
import { Category } from '../fuel-resource/categories/category';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material';

@Component({
  selector: 'ign-searchbar',
  templateUrl: 'searchbar.component.html',
  styleUrls: ['searchbar.component.scss'],
})
export class SearchbarComponent implements OnInit {

  public listCategories: Map<string, string>;

  public selectedCategories: string[];

  public categorySelectionForm = new FormControl(this.listCategories);

  constructor(
    public categoryService: CategoryService,
    private router: Router,
  ) {}

  public ngOnInit(): void {
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

  /**
   * Event triggered by a change in selection.
   *
   * @param event The Select Change event that contains the new categories.
   */
  public selectionChange(event: MatSelectChange) {
    // Change the categories.
    this.selectedCategories.push(event.value);
  }

  public categoryKeys(): string[] {
    return Array.from(this.listCategories.keys());
  }

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
}
