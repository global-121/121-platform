import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { QueryClient } from '@tanstack/angular-query-experimental';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { UserApiService } from '~/domains/user/user.api.service';
import { AuthService } from '~/services/auth.service';
import { LogService } from '~/services/log.service';
import { createLocalStorageMock } from '~/test-utils';
import { LocalStorageUser } from '~/utils/local-storage';

interface MockAuthStrategy {
  isUserExpired: jest.Mock<boolean>;
  logout: jest.Mock<Promise<void>>;
}

describe('AuthService - hasDeprecatedPermissions', () => {
  let service: AuthService;
  let mockRouter: jest.Mocked<Router>;
  let mockLogService: jest.Mocked<LogService>;
  let mockAuthStrategy: MockAuthStrategy;
  let mockInjector: jest.Mocked<Injector>;
  let mockUserApiService: jest.Mocked<UserApiService>;
  let mockQueryClient: jest.Mocked<QueryClient>;

  const createMockUser = (
    permissions: Record<number, PermissionEnum[]>,
  ): LocalStorageUser => ({
    username: 'testuser',
    isAdmin: false,
    isOrganizationAdmin: false,
    permissions,
  });
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock();
    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;
    mockLogService = {
      logEvent: jest.fn(),
    } as unknown as jest.Mocked<LogService>;
    mockInjector = {
      get: jest.fn(),
    } as unknown as jest.Mocked<Injector>;
    mockAuthStrategy = {
      logout: jest.fn<Promise<void>, []>(),
      isUserExpired: jest.fn<boolean, []>(),
    };
    mockUserApiService = {
      getCurrent: jest.fn(),
    } as unknown as jest.Mocked<UserApiService>;
    mockQueryClient = {
      fetchQuery: jest.fn(),
    } as unknown as jest.Mocked<QueryClient>;

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Did not manage to get test working otherwise
    mockInjector.get.mockReturnValue(mockAuthStrategy);

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
      mockAuthStrategy.logout.mockResolvedValue(undefined);
      mockRouter.navigate.mockResolvedValue(true);
    });

    it('should trigger logout when user has deprecated permissions', () => {
      const userWithDeprecatedPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          'DEPRECATED_PERMISSION' as PermissionEnum,
        ],
      });
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify(userWithDeprecatedPermissions),
      );
      jest.spyOn(service, 'logout').mockResolvedValue(undefined);

      const result = service.user;

      expect(result).toBeNull();
      expect(service.logout).toHaveBeenCalledWith(
        userWithDeprecatedPermissions,
      );
    });

    it('should return user when permissions are valid', () => {
      const userWithValidPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationBulkUPDATE,
        ],
      });
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify(userWithValidPermissions),
      );

      const result = service.user;

      expect(result).toEqual(userWithValidPermissions);
    });
  });
});
