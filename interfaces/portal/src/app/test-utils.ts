/*
 * Needed because we can't directly spy on localStorage from Firefox.
 *
 * See: https://github.com/jasmine/jasmine/issues/299
 */
export const createLocalStorageMock = () =>
  // This spies on session storage as well. We should rename this helper
  // if we also rely on this function for that.
  spyOnAllFunctions(Storage.prototype);
