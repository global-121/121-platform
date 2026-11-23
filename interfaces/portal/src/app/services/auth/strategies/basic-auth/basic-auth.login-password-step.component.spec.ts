import { TestBed } from '@angular/core/testing';

import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '~/services/auth.service';
import { BasicAuthLoginPasswordStepComponent } from '~/services/auth/strategies/basic-auth/basic-auth.login-password-step.component';
import {
  TrackingAction,
  TrackingCategory,
} from '~/services/tracking/tracking.enums';
import { TrackingService } from '~/services/tracking/tracking.service';

describe('Logging in with a password', () => {
  const email = 'test@example.com';
  let mockAuthService: { login: ReturnType<typeof vi.fn> };
  let mockTrackingService: { trackEvent: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    mockAuthService = { login: vi.fn() };
    mockTrackingService = { trackEvent: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(new QueryClient()),
        { provide: AuthService, useValue: mockAuthService },
        { provide: TrackingService, useValue: mockTrackingService },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createComponent = () => {
    const fixture = TestBed.createComponent(
      BasicAuthLoginPasswordStepComponent,
    );
    fixture.componentRef.setInput('email', email);
    // Runs the effects through which the mutations report their state
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  // Mutations report state changes to their signals on a timer, so let those run
  const flushMutation = () => vi.advanceTimersByTimeAsync(0);

  it('should track a successful login with a password', async () => {
    // Arrange
    mockAuthService.login.mockResolvedValue(undefined);
    const component = createComponent();

    // Act
    component.loginMutation.mutate({ email, password: 'password' });
    await flushMutation();

    // Assert
    expect(mockTrackingService.trackEvent).toHaveBeenCalledWith({
      category: TrackingCategory.logIn,
      action: TrackingAction.submitLogInWithPassword,
      name: 'Success',
    });
  });

  it('should track a failed login with a password', async () => {
    // Arrange
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
    const component = createComponent();

    // Act
    component.loginMutation.mutate({ email, password: 'wrong-password' });
    await flushMutation();

    // Assert
    expect(mockTrackingService.trackEvent).toHaveBeenCalledWith({
      category: TrackingCategory.logIn,
      action: TrackingAction.submitLogInWithPassword,
      name: 'Failure',
    });
  });
});
