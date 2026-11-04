export const LOCAL_STORAGE_DEBUG_DATA_LIST_KEY = 'debug-data-list';

const LOCAL_STORAGE_DEBUG_ENABLED_VALUE = 'true';

const isDebugEnabled = ({
  localStorageKey,
}: {
  localStorageKey: string;
}): boolean =>
  localStorage.getItem(localStorageKey) === LOCAL_STORAGE_DEBUG_ENABLED_VALUE;

export const debugLog = ({
  localStorageKey,
  message,
  details,
}: {
  localStorageKey: string;
  message: string;
  details?: Record<string, unknown>;
}): void => {
  if (!isDebugEnabled({ localStorageKey })) {
    return;
  }

  console.debug(`[${localStorageKey}] ${message}`, details ?? '');
};
