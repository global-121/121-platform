/**
 * @param {string} connectionString Format: "id=<site-id-number>;api=<host-of-matomo.php>"
 * @returns {{ id?: string; api?: string; }}
 */
export const parseMatomoConnectionString = (connectionString) => {
  const properties = ['id', 'api'];

  /** @type {{ id?: string; api?: string; }} */
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
