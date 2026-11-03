import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OTP_REISSUE_COOLDOWN_MS } from '@121-service/src/user/user-otp/user-otp.const';

import { BasicAuthLoginComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login.component';

describe('Requesting a one-time login code', () => {
  const email = 'test@example.com';
  const now = new Date('2026-01-01T12:00:00.000Z').getTime();
  let component: BasicAuthLoginComponent;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    component = TestBed.runInInjectionContext(
      () => new BasicAuthLoginComponent(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the code step for the email with the request time set to now', () => {
    // Act
    component.onOtpRequested({ email });

    // Assert
    expect(component.step()).toBe(component.LoginStep.otp);
    expect(component.email()).toBe(email);
    expect(component.otpRequest()).toEqual({ email, requestedAt: now });
  });

  it('should keep the original request time when the same email requests again within the cooldown', () => {
    // Arrange
    component.onOtpRequested({ email });
    vi.setSystemTime(now + OTP_REISSUE_COOLDOWN_MS - 1);

    // Act
    component.onOtpRequested({ email });

    // Assert
    expect(component.otpRequest()).toEqual({ email, requestedAt: now });
  });

  it('should set a new request time when the same email requests again after the cooldown', () => {
    // Arrange
    component.onOtpRequested({ email });
    const later = now + OTP_REISSUE_COOLDOWN_MS;
    vi.setSystemTime(later);

    // Act
    component.onOtpRequested({ email });

    // Assert
    expect(component.otpRequest()).toEqual({ email, requestedAt: later });
  });

  it('should set a new request time when a different email requests within the cooldown', () => {
    // Arrange
    component.onOtpRequested({ email });
    const otherEmail = 'other@example.com';
    const later = now + 1;
    vi.setSystemTime(later);

    // Act
    component.onOtpRequested({ email: otherEmail });

    // Assert
    expect(component.email()).toBe(otherEmail);
    expect(component.otpRequest()).toEqual({
      email: otherEmail,
      requestedAt: later,
    });
  });
});
