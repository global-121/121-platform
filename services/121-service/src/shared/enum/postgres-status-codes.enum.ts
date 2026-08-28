/**
 * PostgreSQL status codes
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const enum PostgresStatusCodes {
  FOREIGN_KEY_VIOLATION = '23503',
  UNIQUE_VIOLATION = '23505',
}
