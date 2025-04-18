/**
 * @param {string} connectionString - Format: "id=<site-id-number>;api=<URL-of-matomo.php>;sdk=<URL-of-matomo.js>"
 * @returns {{ id: string; api: string; sdk: string; }}
 */
export const parseMatomoConnectionString = (connectionString) => {
  const connection = {
    api: '',
    id: '',
    sdk: '',
  };

  if (typeof connectionString === 'string') {
    const allParts = connectionString.split(';');

    allParts.forEach((part) => {
      const [key, value] = part.split('=');

      if (Object.keys(connection).includes(key)) {
        connection[key] = value;
      }
    });
  }

  return connection;
};
