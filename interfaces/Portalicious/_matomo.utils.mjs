/**
 * @param {string} connectionString - Format: "id=<site-id-number>;api=<URL-of-matomo.php>;sdk=<URL-of-matomo.js>"
 * @returns {{ id?: string; api?: string; sdk?: string; }}
 */
export const parseMatomoConnectionString = (connectionString) => {
  const properties = ['id', 'api', 'sdk'];

  /** @type {{ id?: string; api?: string; sdk?: string; }} */
  const connection = {};

  if (typeof connectionString === 'string') {
    const allParts = connectionString.split(';');

    allParts.forEach((part) => {
      const [key, value] = part.split('=');

      if (properties.includes(key)) {
        connection[key] = value;
      }
    });
  }

  return connection;
};
