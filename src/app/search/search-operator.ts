/**
 * SearchOperator represents a pair of properties to allow filtering result on the search bar.
 *
 */
export class SearchOperator {
    /**
     * The keyword that allows us to filter.
     */
    public keyword: string;
    /**
     * The value that a certain key has.
     */
    public value: string;
    constructor(keyword: string, value: string) {
        this.keyword = keyword;
        this.value = value;
    }
}