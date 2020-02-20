/**
 * A class that represents a Category.
 */
export class Category {

  /**
   * The ID of the category.
   */
  public id: number;

  /**
   * The name of the category.
   */
  public name: string;

  /**
   * The category's slug.
   */
  public slug: string;

  /**
   * The parent ID.
   */
  public parentId: number;

  /**
   * @param json A JSON that contains the required fields of the category.
   */
  constructor(json: any) {
    this.id = json['id'];
    this.parentId = json['parent_id'];
    this.name = json['name'];
    this.slug = json['slug'];
  }
}
