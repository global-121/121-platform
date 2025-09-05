import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AuthService } from '~/services/auth.service';
import { LogService } from '~/services/log.service';
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

    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Did not manage to get test working otherwise
    mockInjector.get.and.returnValue(mockAuthStrategy);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: LogService, useValue: mockLogService },
        { provide: Injector, useValue: mockInjector },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('user getter with deprecated permissions', () => {
    let localStorageGetItemSpy: jasmine.Spy<typeof localStorage.getItem>;
    beforeEach(() => {
      localStorageGetItemSpy = spyOn(localStorage, 'getItem').and.returnValue(
        null,
      );
      spyOn(localStorage, 'removeItem');
      mockAuthStrategy.isUserExpired.and.returnValue(false);
      mockAuthStrategy.logout.and.returnValue(Promise.resolve());
      mockRouter.navigate.and.returnValue(Promise.resolve(true));
    });

    it('should trigger logout when user has deprecated permissions', () => {
      const userWithDeprecatedPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          'DEPRECATED_PERMISSION' as PermissionEnum,
        ],
      });

      localStorageGetItemSpy.and.returnValue(
        JSON.stringify(userWithDeprecatedPermissions),
      );
      const logoutSpy = spyOn(service, 'logout').and.returnValue(
        Promise.resolve(),
      );

      const result = service.user;

      expect(result).toBeNull();
      expect(logoutSpy).toHaveBeenCalledWith(userWithDeprecatedPermissions);
    });

    it('should return user when permissions are valid', () => {
      const userWithValidPermissions = createMockUser({
        1: [
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationBulkUPDATE,
        ],
      });

      localStorageGetItemSpy.and.returnValue(
        JSON.stringify(userWithValidPermissions),
      );

      const result = service.user;

      expect(result).toEqual(userWithValidPermissions);
    });
  });
});
