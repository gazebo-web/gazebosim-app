/**
 * An enum module with server error codes.
 */
export enum ErrMsg {

  /**
   * ErrorFormDuplicateModelName is triggered when the POSTed model carries duplicate
   * model name.
   */
  ErrorFormDuplicateModelName = 3015,

  /**
   * ErrorFormDuplicateWorldName is triggered when the POSTed world carries duplicate
   * world name.
   */
  ErrorFormDuplicateWorldName = 3018,

  /**
   * ErrorAuthNoUser is triggered when there's no user in the database with the
   * claimed user ID.
   */
  ErrorAuthNoUser = 4000,

  /**
   * ErrorResourceExists is triggered when the server cannot create a new resource
   * because the requested id already exists. E.g.: When the creation of a new
   * model is requested but the server already has a model with the same id.
   */
  ErrorResourceExists = 100001
}
