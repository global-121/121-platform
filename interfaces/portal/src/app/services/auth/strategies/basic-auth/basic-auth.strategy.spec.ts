import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { UserApiService } from '~/domains/user/user.api.service';
import { BasicAuthStrategy } from '~/services/auth/strategies/basic-auth/basic-auth.strategy';
import { createLocalStorageMock } from '~/test-utils';
import {
  LOCAL_STORAGE_AUTH_USER_KEY,
  LocalStorageUser,
} from '~/utils/local-storage';

describe('BasicAuthStrategy - getTimeUntilExpiration', () => {
  let strategy: BasicAuthStrategy;
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  const setLocalStorageUser = (user: null | Partial<LocalStorageUser>) => {
    if (user === null) {
      localStorageMock.getItem.and.returnValue(null);
    } else {
      localStorageMock.getItem
        .withArgs(LOCAL_STORAGE_AUTH_USER_KEY)
        .and.returnValue(JSON.stringify(user));
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BasicAuthStrategy,
        {
          provide: Router,
          useValue: jasmine.createSpyObj<Router>('Router', ['navigate']),
        },
        {
          provide: UserApiService,
          useValue: jasmine.createSpyObj<UserApiService>('UserApiService', [
            'login',
          ]),
        },
      ],
    });

    strategy = TestBed.inject(BasicAuthStrategy);
    localStorageMock = createLocalStorageMock();
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
