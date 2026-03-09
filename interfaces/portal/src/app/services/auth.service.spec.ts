import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { QueryClient } from '@tanstack/angular-query-experimental';
import {
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type MockedObject,
  vi,
} from 'vitest';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { UserApiService } from '~/domains/user/user.api.service';
import { AuthService } from '~/services/auth.service';
import { LogService } from '~/services/log.service';
import { LocalStorageUser } from '~/utils/local-storage';

interface MockAuthStrategy {
  isUserExpired: Mock;
  logout: Mock;
}

describe('AuthService - hasDeprecatedPermissions', () => {
  let service: AuthService;
  let mockRouter: MockedObject<Router>;
  let mockLogService: MockedObject<LogService>;
  let mockAuthStrategy: MockAuthStrategy;
  let mockInjector: MockedObject<Injector>;
  let mockUserApiService: MockedObject<UserApiService>;
  let mockQueryClient: MockedObject<QueryClient>;

  const createMockUser = (
    permissions: Record<number, PermissionEnum[]>,
  ): LocalStorageUser => ({
    username: 'testuser',
    isAdmin: false,
    isOrganizationAdmin: false,
    permissions,
  });

  beforeEach(() => {
    mockRouter = vi.mocked({
      navigate: vi.fn().mockName('Router.navigate'),
    } as unknown as Router);
    mockLogService = vi.mocked({
      logEvent: vi.fn().mockName('LogService.logEvent'),
    } as unknown as LogService);
    mockInjector = vi.mocked({
      get: vi.fn().mockName('Injector.get'),
    } as unknown as Injector);
    mockAuthStrategy = {
      logout: vi.fn(),
      isUserExpired: vi.fn(),
    };
    mockUserApiService = vi.mocked({
      getCurrent: vi.fn().mockName('UserApiService.getCurrent'),
    } as unknown as UserApiService);
    mockQueryClient = vi.mocked({
      fetchQuery: vi.fn().mockName('QueryClient.fetchQuery'),
    } as unknown as QueryClient);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Did not manage to get test working otherwise
    mockInjector.get.mockReturnValue(mockAuthStrategy);

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: LogService, useValue: mockLogService },
        { provide: Injector, useValue: mockInjector },
        { provide: UserApiService, useValue: mockUserApiService },
        { provide: QueryClient, useValue: mockQueryClient },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('user getter with deprecated permissions', () => {
    beforeEach(() => {
      mockAuthStrategy.isUserExpired.mockReturnValue(false);
      mockAuthStrategy.logout.mockReturnValue(Promise.resolve());
      mockRouter.navigate.mockReturnValue(Promise.resolve(true));
    });

    it('should trigger logout when user has deprecated permissions', () => {
      // Arrange
      const userWithDeprecatedPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          'DEPRECATED_PERMISSION' as PermissionEnum,
        ],
      });
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(userWithDeprecatedPermissions),
      );
      const logoutSpy = vi
        .spyOn(service, 'logout')
        .mockReturnValue(Promise.resolve());

      // Act - the user getter is called
      const result = service.user;

      // Assert
      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalledWith(userWithDeprecatedPermissions);
    });

    it('should return user when permissions are valid', () => {
      // Arrange
      const userWithValidPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationBulkUPDATE,
        ],
      });
      vi.mocked(localStorage.getItem).mockReturnValue(
        JSON.stringify(userWithValidPermissions),
      );

      // Act - the user getter is called
      const result = service.user;

      // Assert
      expect(result).toEqual(userWithValidPermissions);
    });
  });
});
