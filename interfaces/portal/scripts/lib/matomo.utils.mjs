/**
 * @param {string | null | undefined} connectionString - Format: "id=<site-id-number>;api=<URL-of-matomo.php>;sdk=<URL-of-matomo.js>"
 * @returns {{ id: string; api: string; sdk: string; }}
 */
export const parseMatomoConnectionString = (connectionString) => {
  const connection = {
    api: '',
    id: '',
    sdk: '',
  };

  if (typeof connectionString !== 'string') {
    return connection;
  }

  const allParts = connectionString.split(';');

  allParts.forEach((part) => {
    let [key, value] = part.split('=');

    key = key?.toLowerCase().trim();
    value = value?.trim();

    if (Object.keys(connection).includes(key)) {
      connection[key] = value;
    }
  });

  return connection;
};
