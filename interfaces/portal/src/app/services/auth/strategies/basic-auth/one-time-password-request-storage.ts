// Kept in sessionStorage so a page reload doesn't restart the countdown for a
// code that the backend won't replace during its reissue cooldown
const SESSION_STORAGE_ONE_TIME_PASSWORD_REQUEST_KEY =
  'one-time-password-request';

export interface OneTimePasswordRequest {
  email: string;
  requestedAt: number;
}

export const setOneTimePasswordRequestInSessionStorage = (
  oneTimePasswordRequest: OneTimePasswordRequest,
): void => {
  sessionStorage.setItem(
    SESSION_STORAGE_ONE_TIME_PASSWORD_REQUEST_KEY,
    JSON.stringify(oneTimePasswordRequest),
  );
};

export const getOneTimePasswordRequestFromSessionStorage = ():
  OneTimePasswordRequest | undefined => {
  const rawOneTimePasswordRequest = sessionStorage.getItem(
    SESSION_STORAGE_ONE_TIME_PASSWORD_REQUEST_KEY,
  );

  if (!rawOneTimePasswordRequest) {
    return undefined;
  }

  try {
    return JSON.parse(rawOneTimePasswordRequest) as OneTimePasswordRequest;
  } catch {
    return undefined;
  }
};

export const removeOneTimePasswordRequestFromSessionStorage = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_ONE_TIME_PASSWORD_REQUEST_KEY);
};
