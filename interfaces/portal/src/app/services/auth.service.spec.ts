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
  isUserExpired: jasmine.Spy<() => boolean>;
  logout: jasmine.Spy<() => Promise<void>>;
}

describe('AuthService - hasDeprecatedPermissions', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogService: jasmine.SpyObj<LogService>;
  let mockAuthStrategy: MockAuthStrategy;
  let mockInjector: jasmine.SpyObj<Injector>;
  let mockUserApiService: jasmine.SpyObj<UserApiService>;
  let mockQueryClient: jasmine.SpyObj<QueryClient>;

  const createMockUser = (
    permissions: Record<number, PermissionEnum[]>,
  ): LocalStorageUser => ({
    username: 'testuser',
    isAdmin: false,
    isOrganizationAdmin: false,
    permissions,
  });

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);
    mockLogService = jasmine.createSpyObj<LogService>('LogService', [
      'logEvent',
    ]);
    mockInjector = jasmine.createSpyObj<Injector>('Injector', ['get']);
    mockAuthStrategy = {
      logout: jasmine.createSpy<() => Promise<void>>('logout'),
      isUserExpired: jasmine.createSpy<() => boolean>('isUserExpired'),
    };
    mockUserApiService = jasmine.createSpyObj<UserApiService>(
      'UserApiService',
      ['getCurrent'],
    );
    mockQueryClient = jasmine.createSpyObj<QueryClient>('QueryClient', [
      'fetchQuery',
    ]);

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Did not manage to get test working otherwise
    mockInjector.get.and.returnValue(mockAuthStrategy);

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
      mockAuthStrategy.isUserExpired.and.returnValue(false);
      mockAuthStrategy.logout.and.returnValue(Promise.resolve());
      mockRouter.navigate.and.returnValue(Promise.resolve(true));
    });

    it('should trigger logout when user has deprecated permissions', () => {
      // Arrange
      const userWithDeprecatedPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          'DEPRECATED_PERMISSION' as PermissionEnum,
        ],
      });
      createLocalStorageMock().getItem.and.returnValue(
        JSON.stringify(userWithDeprecatedPermissions),
      );
      const logoutSpy = spyOn(service, 'logout').and.returnValue(
        Promise.resolve(),
      );

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
      createLocalStorageMock().getItem.and.returnValue(
        JSON.stringify(userWithValidPermissions),
      );

      // Act - the user getter is called
      const result = service.user;

      // Assert
      expect(result).toEqual(userWithValidPermissions);
    });
  });
});
