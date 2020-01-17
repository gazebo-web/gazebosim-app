import { AccessToken } from './access-token';

/**
 * A class that represents a Paginated List of Access Tokens.
 */
export class PaginatedAccessToken {
    /**
     * The total number of access tokens.
     */
    public totalCount: number = 0;

    /**
     * The next page used to load more tokens.
     */
    public nextPage: string = null;

    /**
     * An array of access tokens that the current page has.
     */
    public accessTokens: AccessToken[] = [];

    /**
     * Whether there is a next page of tokens or not.
     */
    public hasNextPage(): boolean {
        return this.nextPage !== null;
    }
}
