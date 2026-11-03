import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserApiService } from '~/domains/user/user.api.service';
import { User } from '~/domains/user/user.model';
import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';
import {
  LOCAL_STORAGE_AUTH_USER_KEY,
  LocalStorageUser,
} from '~/utils/local-storage';

describe('Logging in', () => {
  const user = { username: 'test@example.com' } as User;
  let strategy: BasicAuthStrategy;
  let userApiService: {
    login: ReturnType<typeof vi.fn>;
    loginWithOtp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userApiService = { login: vi.fn(), loginWithOtp: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        BasicAuthStrategy,
        {
          provide: Router,
          useValue: vi.mocked({
            navigate: vi.fn(),
          } as unknown as Router),
        },
        {
          provide: UserApiService,
          useValue: userApiService,
        },
      ],
    });

    strategy = TestBed.inject(BasicAuthStrategy);
  });

  it('should log in with a one-time code when an OTP is given', async () => {
    // Arrange
    userApiService.loginWithOtp.mockResolvedValue(user);

    // Act
    const result = await strategy.login({
      username: 'test@example.com',
      otp: 'ABC123',
    });

    // Assert
    expect(result).toBe(user);
  });

  it('should throw a code-specific error when logging in with a one-time code fails', async () => {
    // Arrange
    userApiService.loginWithOtp.mockRejectedValue(new Error('Unauthorized'));

    // Act
    const loginPromise = strategy.login({
      username: 'test@example.com',
      otp: 'ABC123',
    });

    // Assert
    await expect(loginPromise).rejects.toThrow('Invalid or expired code');
  });

  it('should log in with a password when a password is given', async () => {
    // Arrange
    userApiService.login.mockResolvedValue(user);

    // Act
    const result = await strategy.login({
      username: 'test@example.com',
      password: 'password',
    });

    // Assert
    expect(result).toBe(user);
  });

  it('should throw a credentials error when logging in with a password fails', async () => {
    // Arrange
    userApiService.login.mockRejectedValue(new Error('Unauthorized'));

    // Act
    const loginPromise = strategy.login({
      username: 'test@example.com',
      password: 'wrong-password',
    });

    // Assert
    await expect(loginPromise).rejects.toThrow('Invalid email or password');
  });

  it('should throw a credentials error when neither a password nor an OTP is given', async () => {
    // Act
    const loginPromise = strategy.login({ username: 'test@example.com' });

    // Assert
    await expect(loginPromise).rejects.toThrow('Invalid email or password');
  });
});

describe('BasicAuthStrategy - getTimeUntilExpiration', () => {
  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

  let strategy: BasicAuthStrategy;

  const setLocalStorageUser = (user: null | Partial<LocalStorageUser>) => {
    if (user === null) {
      getItemSpy.mockReturnValue(null);
    } else {
      getItemSpy.mockImplementation((key: string) =>
        key === LOCAL_STORAGE_AUTH_USER_KEY ? JSON.stringify(user) : null,
      );
    }
  };

  beforeEach(() => {
    getItemSpy.mockClear();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        BasicAuthStrategy,
        {
          provide: Router,
          useValue: vi.mocked({
            navigate: vi.fn(),
          } as unknown as Router),
        },
        {
          provide: UserApiService,
          useValue: vi.mocked({
            login: vi.fn(),
          } as unknown as UserApiService),
        },
      ],
    });

    strategy = TestBed.inject(BasicAuthStrategy);
  });

  it('should return Infinity when no user is in localStorage', () => {
    setLocalStorageUser(null);

    expect(strategy.getTimeUntilExpiration()).toBe(Infinity);
  });

  it('should return Infinity when user has no expires field', () => {
    setLocalStorageUser({ username: 'test@example.com', expires: undefined });

    expect(strategy.getTimeUntilExpiration()).toBe(Infinity);
  });

  it('should return a positive number when the token has not expired yet', () => {
    const expiresInOneHour = new Date(Date.now() + 3_600_000).toISOString();
    setLocalStorageUser({
      username: 'test@example.com',
      expires: expiresInOneHour,
    });

    const result = strategy.getTimeUntilExpiration();

    expect(result).toBeGreaterThan(0);
  });

  it('should return a negative number when the token has already expired', () => {
    const expiredOneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    setLocalStorageUser({
      username: 'test@example.com',
      expires: expiredOneHourAgo,
    });

    const result = strategy.getTimeUntilExpiration();

    expect(result).toBeLessThan(0);
  });
});
