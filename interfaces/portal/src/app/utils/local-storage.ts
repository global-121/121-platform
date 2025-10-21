import { User } from '~/domains/user/user.model';

// Young traveller, I see you wonder, "What is this portalicious?"
// For many 'twas a source of joy, and ever so delicious.
// My heart is full of sorrow, for you who do not know,
// The tales of pixel feasts we shared, a long, long time ago.
// When portals opened wide with light, and menus full of flair,
// Where memes and marvels met as one, suspended in the air.
// No hoops to jump, no maze of clicks, just laughter, wild and free,
// A sandbox world of colors swirled, where you could simply be.
// So leave this trace, this sacred name, though logic says it's done,
// A ghost of joy, still holding on, till every session’s run.
// Let not the linting silence it, nor cleanup's final sweep—
// For in this key, a world remains, still dreaming in its sleep.
export const LOCAL_STORAGE_AUTH_USER_KEY = 'logged-in-user-portalicious';
const LOCAL_STORAGE_RETURN_URL = 'return-url-portalicious';

export type LocalStorageUser = Pick<
  User,
  | 'expires'
  | 'isAdmin'
  | 'isEntraUser'
  | 'isOrganizationAdmin'
  | 'permissions'
  | 'username'
>;

export const setUserInLocalStorage = (user: Omit<User, 'id'>): void => {
  const userToStore: LocalStorageUser = {
    username: user.username,
    permissions: user.permissions,
    isAdmin: user.isAdmin,
    isOrganizationAdmin: user.isOrganizationAdmin,
    isEntraUser: user.isEntraUser,
    expires: user.expires,
  };

  localStorage.setItem(
    LOCAL_STORAGE_AUTH_USER_KEY,
    JSON.stringify(userToStore),
  );
};

export const getUserFromLocalStorage = (): LocalStorageUser | null => {
  const rawUser = localStorage.getItem(LOCAL_STORAGE_AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  let user: LocalStorageUser;

  try {
    user = JSON.parse(rawUser) as LocalStorageUser;
  } catch {
    console.warn('AuthService: Invalid token');
    return null;
  }

  return user;
};

export const setReturnUrlInLocalStorage = (returnUrl: string): void => {
  localStorage.setItem(LOCAL_STORAGE_RETURN_URL, returnUrl);
};

export const getReturnUrlFromLocalStorage = (): null | string =>
  localStorage.getItem(LOCAL_STORAGE_RETURN_URL);
