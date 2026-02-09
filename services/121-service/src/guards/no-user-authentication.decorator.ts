import { SetMetadata } from '@nestjs/common';

/**
 * Marks an entire controller as not requiring user-based authentication.
 *
 * Use this when the controller is protected by a non-user mechanism
 * (for example Twilio signatures, shared secrets, or IP allowlists)
 * instead of AuthenticatedUserGuard.
 */
export const NoUserAuthenticationController = () =>
  SetMetadata('authenticationParameters', {
    isGuarded: false,
  });

/**
 * Marks a single endpoint as not requiring user-based authentication.
 *
 * Use this for specific routes (such as login or webhooks) that are
 * intentionally exempt from AuthenticatedUserGuard but secured
 * through other means.
 */
export const NoUserAuthenticationEndpoint = () =>
  SetMetadata('authenticationParameters', {
    isGuarded: false,
  });
