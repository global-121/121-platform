import { SetMetadata } from '@nestjs/common';

/**
 * Marks an entire controller as not requiring user-based authentication.
 *
 * Use this when the controller is protected by a non-user mechanism
 * (for example Twilio signatures, shared secrets, or IP allowlists)
 * instead of AuthenticatedUserGuard.
 *
 * @param _reason - Explanation for why this controller does not require user authentication
 */
export const NoUserAuthenticationController = (_reason: string) =>
  SetMetadata('authenticationParameters', {
    isGuarded: false,
  });

/**
 * Marks a single endpoint as not requiring user-based authentication.
 *
 * Use this for specific routes (such as login or webhooks) that are
 * intentionally exempt from AuthenticatedUserGuard but secured
 * through other means.
 *
 * @param _reason - Explanation for why this endpoint does not require user authentication
 */
export const NoUserAuthenticationEndpoint = (_reason: string) =>
  SetMetadata('authenticationParameters', {
    isGuarded: false,
  });
