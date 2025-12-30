export enum FspMode {
  /**
   * This specific FSP integration is explicitly disabled. It should not be
   * configurable using the backend API or visible in the admin UI. See AB#39825
   * and AB#38588. In this mode we do *not* require other environment variables
   * to be set for the FSP.
   *
   * This is the default value.
   *
   * This is used:
   * - in production
   * - locally (potentially)
   */
  disabled = 'DISABLED',
  /**
   * The 121-service talks to the mock service for this FSP. In this mode we
   * don't require other environment variables to be set for the FSP.
   *
   * This is used:
   * - locally (dev and testing)
   * - in CI
   * - in environments where we don't want to use the real external service
   */
  mock = 'MOCK',

  /**
   * The 121-service talks to a real external service for this FSP.
   * In this mode we require all other environment variables for the FSP to be
   * set.
   *
   * This is used:
   * - locally against sandbox/staging environments (during initial development
   *   of an FSP integration for example)
   * - in demo/staging environments against sandbox/staging environments of the
   *   FSP
   * - in production environments against the production environment of the FSP
   */
  external = 'EXTERNAL',
}
