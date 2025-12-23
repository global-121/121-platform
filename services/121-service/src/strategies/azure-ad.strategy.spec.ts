import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { AzureAdStrategy } from '@121-service/src/strategies/azure-ad.strategy';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { UserService } from '@121-service/src/user/user.service';

describe('AzureAdStrategy', () => {
  let strategy: AzureAdStrategy;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AzureAdStrategy,
        {
          provide: ModuleRef,
          useValue: {
            resolve: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get(AzureAdStrategy);

    // Mock UserService
    userService = {
      findByUsernameOrThrow: jest.fn(),
      updateUser: jest.fn(),
      canActivate: jest.fn(),
      getScopeForUser: jest.fn(),
    } as any;

    // Setup strategy's userService
    strategy['userService'] = userService;
  });

  describe('validate', () => {
    const createMockUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
      ({
        id: 1,
        username: 'test@example.com',
        admin: false,
        isEntraUser: true,
        lastLogin: new Date('2025-12-10'),
        isOrganizationAdmin: false,
        hashPassword: jest.fn(),
        ...overrides,
      }) as UserEntity;

    const mockPayload = {
      unique_name: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      isOrganizationAdmin: false,
    };

    const mockRequest = {
      params: { programId: '123' },
      authenticationParameters: {
        isGuarded: true,
      } as AuthenticatedUserParameters,
    };

    describe('payload validation', () => {
      it('should throw UnauthorizedException when payload is null', async () => {
        await expect(strategy.validate({}, null)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException when payload is undefined', async () => {
        await expect(strategy.validate({}, undefined)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException when unique_name and preferred_username are missing', async () => {
        const invalidPayload = { exp: 123456789 };
        await expect(strategy.validate({}, invalidPayload)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should throw UnauthorizedException when exp is missing', async () => {
        const invalidPayload = { unique_name: 'test@example.com' };
        await expect(strategy.validate({}, invalidPayload)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('should return true when authParams is not guarded', async () => {
        const request = {
          authenticationParameters: {
            isGuarded: false,
          } as AuthenticatedUserParameters,
        };

        const result = await strategy.validate(request, mockPayload);
        expect(result).toBe(true);
      });

      it('should return true when authParams is undefined', async () => {
        const request = {};

        const result = await strategy.validate(request, mockPayload);
        expect(result).toBe(true);
      });
    });

    describe('username processing', () => {
      beforeEach(() => {
        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);
      });

      it('should process unique_name correctly', async () => {
        const result = await strategy.validate(mockRequest, mockPayload);
        expect(result).toBeDefined();
      });

      it('should process preferred_username when unique_name is not available', async () => {
        const payload = {
          preferred_username: 'test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          isOrganizationAdmin: false,
        };

        const result = await strategy.validate(mockRequest, payload);
        expect(result).toBeDefined();
      });

      it('should handle username with mail# prefix', async () => {
        const payload = {
          unique_name: 'mail#test@example.com',
          exp: Math.floor(Date.now() / 1000) + 3600,
          isOrganizationAdmin: false,
        };

        const result = await strategy.validate(mockRequest, payload);
        expect(result).toBeDefined();
      });

      it('should convert username to lowercase', async () => {
        const payload = {
          unique_name: 'TEST@EXAMPLE.COM',
          exp: Math.floor(Date.now() / 1000) + 3600,
          isOrganizationAdmin: false,
        };

        const result = await strategy.validate(mockRequest, payload);
        expect(result).toBeDefined();
      });
    });

    describe('isEntraUser updates', () => {
      it('should update user to isEntraUser when not already set', async () => {
        const nonEntraUser = createMockUser({ isEntraUser: false });
        const updatedUser = createMockUser({ isEntraUser: true });

        userService.findByUsernameOrThrow.mockResolvedValue(nonEntraUser);
        userService.updateUser.mockResolvedValue(updatedUser);

        await strategy.validate(mockRequest, mockPayload);

        expect(userService.updateUser).toHaveBeenCalledWith({
          id: nonEntraUser.id,
          isEntraUser: true,
        });
      });

      it('should not update isEntraUser when already set', async () => {
        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);

        await strategy.validate(mockRequest, mockPayload);

        expect(userService.updateUser).not.toHaveBeenCalledWith({
          id: 1,
          isEntraUser: true,
        });
      });
    });

    describe('lastLogin updates', () => {
      it('should update lastLogin when user has never logged in', async () => {
        const userWithoutLogin = createMockUser({ lastLogin: null });
        userService.findByUsernameOrThrow.mockResolvedValue(userWithoutLogin);
        userService.updateUser.mockResolvedValue(userWithoutLogin);

        await strategy.validate(mockRequest, mockPayload);

        expect(userService.updateUser).toHaveBeenCalledWith({
          id: userWithoutLogin.id,
          lastLogin: expect.any(Date),
        });
      });

      it('should update lastLogin when last login was on different day', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const userWithOldLogin = createMockUser({ lastLogin: yesterday });

        userService.findByUsernameOrThrow.mockResolvedValue(userWithOldLogin);
        userService.updateUser.mockResolvedValue(userWithOldLogin);

        await strategy.validate(mockRequest, mockPayload);

        expect(userService.updateUser).toHaveBeenCalledWith({
          id: userWithOldLogin.id,
          lastLogin: expect.any(Date),
        });
      });

      it('should not update lastLogin when user logged in today', async () => {
        const today = new Date();
        const userWithTodayLogin = createMockUser({ lastLogin: today });

        userService.findByUsernameOrThrow.mockResolvedValue(userWithTodayLogin);

        await strategy.validate(mockRequest, mockPayload);

        expect(userService.updateUser).not.toHaveBeenCalledWith({
          id: userWithTodayLogin.id,
          lastLogin: expect.any(Date),
        });
      });
    });

    describe('permissions and authorization', () => {
      it('should throw HttpException when programId is missing for permissions check', async () => {
        const requestWithoutProgramId = {
          params: {},
          authenticationParameters: {
            isGuarded: true,
            permissions: [PermissionEnum.ProgramUPDATE],
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);

        await expect(
          strategy.validate(requestWithoutProgramId, mockPayload),
        ).rejects.toThrow(
          new HttpException(
            'Endpoint is missing programId parameter',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('should check permissions and allow access when user has permission', async () => {
        const requestWithPermissions = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            permissions: [PermissionEnum.ProgramUPDATE],
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);
        userService.canActivate.mockResolvedValue(true);
        userService.getScopeForUser.mockReturnValue('test-scope');

        const result = await strategy.validate(
          requestWithPermissions,
          mockPayload,
        );

        expect(result).toEqual({
          id: 1,
          username: 'test@example.com',
          exp: mockPayload.exp,
          admin: false,
          scope: 'test-scope',
          isOrganizationAdmin: mockPayload.isOrganizationAdmin,
        });
      });

      it('should throw Forbidden when user lacks required permission', async () => {
        const requestWithPermissions = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            permissions: [PermissionEnum.ProgramUPDATE],
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);
        userService.canActivate.mockResolvedValue(false);

        await expect(
          strategy.validate(requestWithPermissions, mockPayload),
        ).rejects.toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
      });

      it('should allow access when user is admin and isAdmin is required', async () => {
        const adminRequest = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            isAdmin: true,
          } as AuthenticatedUserParameters,
        };

        const adminUser = createMockUser({ admin: true });
        userService.findByUsernameOrThrow.mockResolvedValue(adminUser);
        userService.getScopeForUser.mockReturnValue('admin-scope');

        const result = await strategy.validate(adminRequest, mockPayload);

        expect(result).toEqual({
          id: 1,
          username: 'test@example.com',
          exp: mockPayload.exp,
          admin: true,
          scope: 'admin-scope',
          isOrganizationAdmin: mockPayload.isOrganizationAdmin,
        });
      });

      it('should throw Forbidden when user is not admin but isAdmin is required', async () => {
        const adminRequest = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            isAdmin: true,
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);

        await expect(
          strategy.validate(adminRequest, mockPayload),
        ).rejects.toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
      });

      it('should allow access when user is organization admin and isOrganizationAdmin is required', async () => {
        const orgAdminRequest = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            isOrganizationAdmin: true,
          } as AuthenticatedUserParameters,
        };

        const orgAdminUser = createMockUser({ isOrganizationAdmin: true });
        userService.findByUsernameOrThrow.mockResolvedValue(orgAdminUser);
        userService.getScopeForUser.mockReturnValue('org-admin-scope');

        const result = await strategy.validate(orgAdminRequest, mockPayload);

        expect(result).toEqual({
          id: 1,
          username: 'test@example.com',
          exp: mockPayload.exp,
          admin: false,
          scope: 'org-admin-scope',
          isOrganizationAdmin: mockPayload.isOrganizationAdmin,
        });
      });

      it('should throw Forbidden when user is not organization admin but isOrganizationAdmin is required', async () => {
        const orgAdminRequest = {
          ...mockRequest,
          authenticationParameters: {
            isGuarded: true,
            isOrganizationAdmin: true,
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);

        await expect(
          strategy.validate(orgAdminRequest, mockPayload),
        ).rejects.toThrow(new HttpException('Forbidden', HttpStatus.FORBIDDEN));
      });

      it('should return empty scope when no programId is provided', async () => {
        const requestWithoutProgramId = {
          params: {},
          authenticationParameters: {
            isGuarded: true,
          } as AuthenticatedUserParameters,
        };

        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);

        const result = await strategy.validate(
          requestWithoutProgramId,
          mockPayload,
        );

        expect(result).toEqual({
          id: 1,
          username: 'test@example.com',
          exp: mockPayload.exp,
          admin: false,
          scope: '',
          isOrganizationAdmin: mockPayload.isOrganizationAdmin,
        });
      });

      it('should return UserRequestData with correct scope when programId is provided', async () => {
        const mockUser = createMockUser();
        userService.findByUsernameOrThrow.mockResolvedValue(mockUser);
        userService.getScopeForUser.mockReturnValue('program-scope');

        const result = await strategy.validate(mockRequest, mockPayload);

        expect(result).toEqual({
          id: 1,
          username: 'test@example.com',
          exp: mockPayload.exp,
          admin: false,
          scope: 'program-scope',
          isOrganizationAdmin: mockPayload.isOrganizationAdmin,
        });
      });

      it('should throw HttpException when user is not found', async () => {
        userService.findByUsernameOrThrow.mockRejectedValue(
          new Error('User not found'),
        );

        await expect(
          strategy.validate(mockRequest, mockPayload),
        ).rejects.toThrow(
          new HttpException(
            { message: 'Unknown user account or authentication failed.' },
            HttpStatus.UNAUTHORIZED,
          ),
        );
      });
    });
  });
});
