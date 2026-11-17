import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ONE_TIME_PASSWORD_EXPIRATION_MS,
  ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS,
} from '@121-service/src/user/user-one-time-password/user-one-time-password.const';

import { UserApiService } from '~/domains/user/user.api.service';
import { AuthService } from '~/services/auth.service';
import { BasicAuthLoginOneTimePasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-one-time-password-step.component';

describe('Logging in with a one-time code', () => {
  const email = 'test@example.com';
  const now = new Date('2026-01-01T12:00:00.000Z').getTime();
  let mockAuthService: { login: ReturnType<typeof vi.fn> };
  let mockUserApiService: {
    createLoginOneTimePassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockAuthService = { login: vi.fn() };
    mockUserApiService = { createLoginOneTimePassword: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserApiService, useValue: mockUserApiService },
        { provide: LOCALE_ID, useValue: 'en' },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createComponent = () => {
    const fixture = TestBed.createComponent(
      BasicAuthLoginOneTimePasswordStepComponent,
    );
    fixture.componentRef.setInput('email', email);
    fixture.componentRef.setInput('oneTimePasswordRequestedAt', now);
    // Runs the effects through which the mutations report their state
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  // Mutations report state changes to their signals on a timer, so let those run
  const flushMutation = () => vi.advanceTimersByTimeAsync(0);

  it('should count down the remaining time and stop at zero once the code has expired', async () => {
    // Arrange
    const component = createComponent();

    // Act & Assert
    await vi.advanceTimersByTimeAsync(ONE_TIME_PASSWORD_EXPIRATION_MS - 1_000);
    expect(component.oneTimePasswordRemainingMs()).toBe(1_000);

    await vi.advanceTimersByTimeAsync(2_000);
    expect(component.oneTimePasswordRemainingMs()).toBe(0);
  });

  it('should only allow requesting a new code once the cooldown has passed', async () => {
    // Arrange
    const component = createComponent();

    // Act & Assert
    await vi.advanceTimersByTimeAsync(
      ONE_TIME_PASSWORD_REISSUE_COOLDOWN_MS - 1_000,
    );
    expect(component.canRequestNewOneTimePassword()).toBe(false);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(component.canRequestNewOneTimePassword()).toBe(true);
  });

  it('should clear the code and the login error, and report the request, when a new code is requested', async () => {
    // Arrange
    mockAuthService.login.mockRejectedValue(new Error('Invalid code'));
    mockUserApiService.createLoginOneTimePassword.mockResolvedValue(undefined);
    const component = createComponent();
    const oneTimePasswordRequested = vi.fn();
    component.oneTimePasswordRequested.subscribe(oneTimePasswordRequested);
    component.formGroup.setValue({ oneTimePassword: 'ABC123' });
    component.loginMutation.mutate({ oneTimePassword: 'ABC123' });
    await flushMutation();

    // Act
    component.requestNewOneTimePasswordMutation.mutate();
    await flushMutation();

    // Assert
    expect(component.formGroup.getRawValue()).toEqual({ oneTimePassword: '' });
    expect(component.loginMutation.isError()).toBe(false);
    expect(oneTimePasswordRequested).toHaveBeenCalledWith({ email });
  });

  it('should clear the login error once the code is edited', async () => {
    // Arrange
    mockAuthService.login.mockRejectedValue(new Error('Invalid code'));
    const component = createComponent();
    component.loginMutation.mutate({ oneTimePassword: 'ABC123' });
    await flushMutation();
    expect(component.loginMutation.isError()).toBe(true);

    // Act
    component.onOneTimePasswordChange({
      originalEvent: new Event('input'),
      value: 'ABC12',
    });
    await flushMutation();

    // Assert
    expect(component.loginMutation.isError()).toBe(false);
  });
});
