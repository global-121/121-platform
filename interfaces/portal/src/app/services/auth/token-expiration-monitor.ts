import { interval, Subscription } from 'rxjs';

/**
 * Starts a continuous monitor that checks for token expiration at regular intervals.
 *
 * Design decisions:
 * - **Always runs**: Monitor starts immediately when called, regardless of login state.
 *   This handles scenarios where users reopen the browser after hours/days and still have a valid token.
 * - **Continues running**: Monitor keeps running even after expiry is triggered. It naturally
 *   returns early when `getTimeUntilExpiration` returns `Infinity`, avoiding duplicate callbacks.
 * - **Strategy-agnostic**: Delegates expiration logic to the caller via `getTimeUntilExpiration`.
 *   - BasicAuth: Returns actual time until token expires (reads from localStorage).
 *   - MSAL: Returns `Infinity` because MSAL handles token refresh automatically.
 * - **Session tracking**: Calls `onTokenValid` whenever the token is still valid. This allows
 *   callers to distinguish between "token expired while the app was running" (show popup) and
 *   "token was already expired when the app started" (silent redirect to login).
 *
 * @remarks
 * The monitor never stops once started. This is intentional to keep the implementation simple
 * and avoid tracking login/logout state to start/stop it. The performance impact is negligible
 * since it only reads from localStorage and does an integer comparison on each tick.
 * This has been moved to a separate utility function to make it more testable and to decouple it from the AuthService implementation.
 */
export const startTokenExpirationMonitor = ({
  checkIntervalMs,
  forceLogoutMs,
  getTimeUntilExpiration,
  onExpired,
  onTokenValid,
}: {
  checkIntervalMs: number;
  forceLogoutMs: number;
  getTimeUntilExpiration: () => number;
  onExpired: () => void;
  onTokenValid?: () => void;
}): Subscription =>
  interval(checkIntervalMs).subscribe(() => {
    const timeUntilExpiry = getTimeUntilExpiration();

    if (timeUntilExpiry === Infinity) {
      // Strategy doesn't require expiration monitoring
      return;
    }

    if (timeUntilExpiry <= forceLogoutMs) {
      onExpired();
    } else {
      onTokenValid?.();
    }
  });
