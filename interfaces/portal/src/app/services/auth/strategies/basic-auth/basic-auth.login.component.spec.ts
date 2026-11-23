import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-one-time-password/user-one-time-password.const';

import { BasicAuthLoginComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login.component';
import { setOneTimePasswordRequestInSessionStorage } from '~/services/auth/strategies/basic-auth/one-time-password-request-storage';
import { TrackingService } from '~/services/tracking/tracking.service';

describe('Requesting a one-time login code', () => {
  const email = 'test@example.com';
  const now = new Date('2026-01-01T12:00:00.000Z').getTime();
  let component: BasicAuthLoginComponent;

  const createComponent = () =>
    TestBed.runInInjectionContext(() => new BasicAuthLoginComponent());

  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    TestBed.configureTestingModule({
      providers: [
        { provide: TrackingService, useValue: { trackEvent: vi.fn() } },
      ],
    });
    component = createComponent();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('should show the code step for the email with the request time set to now', () => {
    // Act
    component.onOneTimePasswordRequested({ email });

    // Assert
    expect(component.step()).toBe(component.LoginStep.oneTimePassword);
    expect(component.email()).toBe(email);
    expect(component.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: now,
    });
  });

  it('should keep the original request time when the same email requests again within the cooldown', () => {
    // Arrange
    component.onOneTimePasswordRequested({ email });
    vi.setSystemTime(now + ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS - 1);

    // Act
    component.onOneTimePasswordRequested({ email });

    // Assert
    expect(component.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: now,
    });
  });

  it('should keep the original request time when the same email in different casing requests again within the cooldown', () => {
    // Arrange
    component.onOneTimePasswordRequested({ email });
    vi.setSystemTime(now + ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS - 1);

    // Act
    component.onOneTimePasswordRequested({ email: 'Test@Example.COM' });

    // Assert
    expect(component.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: now,
    });
  });

  it('should set a new request time when the same email requests again after the cooldown', () => {
    // Arrange
    component.onOneTimePasswordRequested({ email });
    const later = now + ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS;
    vi.setSystemTime(later);

    // Act
    component.onOneTimePasswordRequested({ email });

    // Assert
    expect(component.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: later,
    });
  });

  it('should set a new request time when a different email requests within the cooldown', () => {
    // Arrange
    component.onOneTimePasswordRequested({ email });
    const otherEmail = 'other@example.com';
    const later = now + 1;
    vi.setSystemTime(later);

    // Act
    component.onOneTimePasswordRequested({ email: otherEmail });

    // Assert
    expect(component.email()).toBe(otherEmail);
    expect(component.oneTimePasswordRequest()).toEqual({
      email: otherEmail,
      requestedAt: later,
    });
  });

  it('should keep the original request time after a page reload within the cooldown', () => {
    // Arrange
    component.onOneTimePasswordRequested({ email });
    vi.setSystemTime(now + ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS - 1);

    // Act
    const componentAfterReload = createComponent();
    componentAfterReload.onOneTimePasswordRequested({ email });

    // Assert
    expect(componentAfterReload.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: now,
    });
  });

  it('should set a new request time after a page reload once the stored request is past the cooldown', () => {
    // Arrange
    setOneTimePasswordRequestInSessionStorage({ email, requestedAt: now });
    const later = now + ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS;
    vi.setSystemTime(later);

    // Act
    const componentAfterReload = createComponent();
    componentAfterReload.onOneTimePasswordRequested({ email });

    // Assert
    expect(componentAfterReload.oneTimePasswordRequest()).toEqual({
      email,
      requestedAt: later,
    });
  });
});
