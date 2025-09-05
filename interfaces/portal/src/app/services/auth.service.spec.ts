import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Injector } from '@angular/core';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AuthService } from './auth.service';
import { LogService } from '~/services/log.service';
import { LocalStorageUser } from '~/utils/local-storage';

describe('AuthService - hasDeprecatedPermissions', () => {
  let service: AuthService;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLogService: jasmine.SpyObj<LogService>;
  let mockInjector: jasmine.SpyObj<Injector>;
  let mockAuthStrategy: jasmine.SpyObj<{ isUserExpired: any; logout: any }>;

  const createMockUser = (
    permissions: Record<number, PermissionEnum[]>,
  ): LocalStorageUser => ({
    username: 'testuser',
    isAdmin: false,
    isOrganizationAdmin: false,
    permissions,
  });

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLogService = jasmine.createSpyObj('LogService', ['logEvent']);
    mockAuthStrategy = jasmine.createSpyObj('AuthStrategy', [
      'logout',
      'isUserExpired',
    ]);
    mockInjector = jasmine.createSpyObj('Injector', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: mockRouter },
        { provide: LogService, useValue: mockLogService },
        { provide: Injector, useValue: mockInjector },
      ],
    });

    mockInjector.get.and.returnValue(mockAuthStrategy);
    service = TestBed.inject(AuthService);
  });

  describe('user getter with deprecated permissions', () => {
    let localStorageGetItemSpy: jasmine.Spy;
    beforeEach(() => {
      localStorageGetItemSpy = spyOn(localStorage, 'getItem').and.returnValue(
        null,
      );
      spyOn(localStorage, 'removeItem');
      mockAuthStrategy.isUserExpired = jasmine
        .createSpy()
        .and.returnValue(false);
      mockAuthStrategy.logout = jasmine
        .createSpy()
        .and.returnValue(Promise.resolve());
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
      spyOn(service, 'logout').and.returnValue(Promise.resolve());

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

      localStorageGetItemSpy.and.returnValue(
        JSON.stringify(userWithValidPermissions),
      );

      const result = service.user;

      expect(result).toEqual(userWithValidPermissions);
    });
  });
});
