import { Subscription } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startTokenExpirationMonitor } from '~/services/auth/token-expiration-monitor';

describe('startTokenExpirationMonitor', () => {
  const CHECK_INTERVAL_MS = 1_000;
  const FORCE_LOGOUT_MS = 120_000;

  let subscription: Subscription;
  let onExpired: ReturnType<typeof vi.fn<() => void>>;
  let getTimeUntilExpiration: ReturnType<typeof vi.fn<() => number>>;

  beforeEach(() => {
    vi.useFakeTimers();
    onExpired = vi.fn<() => void>();
    getTimeUntilExpiration = vi.fn<() => number>().mockReturnValue(Infinity);
  });

  afterEach(() => {
    subscription.unsubscribe();
    vi.useRealTimers();
  });

  it('should not call onExpired when getTimeUntilExpiration returns Infinity', () => {
    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS * 5);

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('should not call onExpired when time remaining is above the threshold', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS + 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS * 5);

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('should call onExpired when time remaining equals the threshold', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('should call onExpired when time remaining is below the threshold', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('should call onExpired on every tick while time remaining stays below the threshold', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS * 3);

    expect(onExpired).toHaveBeenCalledTimes(3);
  });

  it('should stop calling onExpired after getTimeUntilExpiration returns Infinity (e.g. after session cleared)', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS);
    expect(onExpired).toHaveBeenCalledTimes(1);

    // Simulate session being cleared (localStorage removed → returns Infinity)
    getTimeUntilExpiration.mockReturnValue(Infinity);

    vi.advanceTimersByTime(CHECK_INTERVAL_MS * 5);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('should not call onExpired after the subscription is unsubscribed', () => {
    getTimeUntilExpiration.mockReturnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    vi.advanceTimersByTime(CHECK_INTERVAL_MS);
    expect(onExpired).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    vi.advanceTimersByTime(CHECK_INTERVAL_MS * 5);

    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
