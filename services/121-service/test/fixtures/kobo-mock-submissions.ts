/**
 * Test submission UUIDs for Kobo integration tests.
 * These UUIDs are used in both integration and unit tests to simulate
 * Kobo webhook submissions.
 * A similair files is stored in the mock service, but code between the 2 cannot be shared in a practical way, so we duplicate the constants here.
 *
 * The mock service matches submissions using `includes()` on these values,
 * so any UUID containing 'success' routes to the happy-flow data, and any
 * UUID containing 'failure' routes to the failure-flow data. This allows
 * tests to generate unique UUIDs per submission (e.g., 'success-1',
 * 'success-2') while still getting predictable mock responses.
 */
export enum KoboMockSubmissionUuids {
  success = 'success',
  failure = 'failure',
}
