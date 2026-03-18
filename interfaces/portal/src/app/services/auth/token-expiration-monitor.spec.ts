import { fakeAsync, tick } from '@angular/core/testing';

import { Subscription } from 'rxjs';

import { startTokenExpirationMonitor } from '~/services/auth/token-expiration-monitor';

describe('startTokenExpirationMonitor', () => {
  const CHECK_INTERVAL_MS = 1_000;
  const FORCE_LOGOUT_MS = 120_000;

  let subscription: Subscription;
  let onExpired: jasmine.Spy;
  let getTimeUntilExpiration: jasmine.Spy<() => number>;

  beforeEach(() => {
    onExpired = jasmine.createSpy('onExpired');
    getTimeUntilExpiration = jasmine
      .createSpy('getTimeUntilExpiration')
      .and.returnValue(Infinity);
  });

  afterEach(() => {
    subscription.unsubscribe();
  });

  it('should not call onExpired when getTimeUntilExpiration returns Infinity', fakeAsync(() => {
    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS * 5);

    expect(onExpired).not.toHaveBeenCalled();
  }));

  it('should not call onExpired when time remaining is above the threshold', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS + 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS * 5);

    expect(onExpired).not.toHaveBeenCalled();
  }));

  it('should call onExpired when time remaining equals the threshold', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
  }));

  it('should call onExpired when time remaining is below the threshold', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
  }));

  it('should call onExpired on every tick while time remaining stays below the threshold', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS * 3);

    expect(onExpired).toHaveBeenCalledTimes(3);
  }));

  it('should stop calling onExpired after getTimeUntilExpiration returns Infinity (e.g. after session cleared)', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS);
    expect(onExpired).toHaveBeenCalledTimes(1);

    // Simulate session being cleared (localStorage removed → returns Infinity)
    getTimeUntilExpiration.and.returnValue(Infinity);

    tick(CHECK_INTERVAL_MS * 5);
    expect(onExpired).toHaveBeenCalledTimes(1);
  }));

  it('should not call onExpired after the subscription is unsubscribed', fakeAsync(() => {
    getTimeUntilExpiration.and.returnValue(FORCE_LOGOUT_MS - 1);

    subscription = startTokenExpirationMonitor({
      checkIntervalMs: CHECK_INTERVAL_MS,
      forceLogoutMs: FORCE_LOGOUT_MS,
      getTimeUntilExpiration,
      onExpired,
    });

    tick(CHECK_INTERVAL_MS);
    expect(onExpired).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    tick(CHECK_INTERVAL_MS * 5);

    expect(onExpired).toHaveBeenCalledTimes(1);
  }));
});
