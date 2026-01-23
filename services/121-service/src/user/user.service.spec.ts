import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let permissionRepository: Repository<PermissionEntity>;
  let userRoleRepository: Repository<UserRoleEntity>;
  let userEmailsService: UserEmailsService;

  const mockRequest = {
    headers: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PermissionEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserRoleEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProgramEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProgramAidworkerAssignmentEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ApproverEntity),
          useClass: Repository,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
        {
          provide: UserEmailsService,
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = await module.resolve<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    permissionRepository = module.get<Repository<PermissionEntity>>(
      getRepositoryToken(PermissionEntity),
    );
    userRoleRepository = module.get<Repository<UserRoleEntity>>(
      getRepositoryToken(UserRoleEntity),
    );
    userEmailsService = module.get<UserEmailsService>(UserEmailsService);
  });

  describe('findUserProgramAssignmentsOrThrow', () => {
    const userId = 123;

    it('should throw HttpException when user is not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findUserProgramAssignmentsOrThrow(userId),
      ).rejects.toThrow(
        new HttpException(
          { errors: 'User not found or no assigned programs' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should throw HttpException when user has no programAssignments', async () => {
      // Arrange
      const mockUser: Partial<UserEntity> = {
        id: userId,
        username: 'test@example.com',
        programAssignments: undefined,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.findUserProgramAssignmentsOrThrow(userId),
      ).rejects.toThrow(
        new HttpException(
          { errors: 'User not found or no assigned programs' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should throw HttpException when user has empty programAssignments array', async () => {
      // Arrange
      const mockUser: Partial<UserEntity> = {
        id: userId,
        username: 'test@example.com',
        programAssignments: [],
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.findUserProgramAssignmentsOrThrow(userId),
      ).rejects.toThrow(
        new HttpException(
          { errors: 'User not found or no assigned programs' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('should return user when user has program assignments', async () => {
      // Arrange
      const mockUser: Partial<UserEntity> = {
        id: userId,
        username: 'test@example.com',
        programAssignments: [
          {
            id: 1,
            programId: 1,
            userId,
            scope: '',
            roles: [],
          } as unknown as ProgramAidworkerAssignmentEntity,
        ],
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await service.findUserProgramAssignmentsOrThrow(userId);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('getProgramScopeIdsUserHasPermission', () => {
    const userId = 123;
    const permission = 'program:write' as any; // Mock permission enum

    it('should throw HttpException when findUserProgramAssignmentsOrThrow fails', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getProgramScopeIdsUserHasPermission(userId, permission),
      ).rejects.toThrow(
        new HttpException(
          { errors: 'User not found or no assigned programs' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe('updateUserRole', () => {
    const userRoleId = 1;
    const mockExistingRole: Partial<UserRoleEntity> = {
      id: userRoleId,
      role: 'test-role',
      label: 'Test Role',
      description: 'Test Description',
      permissions: [],
    };

    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
      // Mock the private findRoleOrThrow method by spying on userRoleRepository.findOneBy
      // Return a fresh copy each time to avoid object mutation across tests
      jest
        .spyOn(userRoleRepository, 'findOneBy')
        .mockImplementation(() =>
          Promise.resolve({ ...mockExistingRole } as UserRoleEntity),
        );
    });

    it('should throw HttpException when role is not found', async () => {
      // Arrange
      jest.spyOn(userRoleRepository, 'findOneBy').mockResolvedValue(null);
      const updateData = { label: 'New Label' };

      // Act & Assert
      await expect(
        service.updateUserRole(userRoleId, updateData),
      ).rejects.toThrow(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should update only the label when provided', async () => {
      // Arrange
      const updateData = { label: 'Updated Label' };
      const expectedRole = { ...mockExistingRole, label: 'Updated Label' };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'Updated Label',
        description: 'Test Description',
        permissions: [],
      });
    });

    it('should update only the description when provided', async () => {
      // Arrange
      const updateData = { description: 'Updated Description' };
      const freshMockRole: Partial<UserRoleEntity> = {
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      };
      const expectedRole = {
        ...freshMockRole,
        description: 'Updated Description',
      };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Updated Description',
        permissions: [],
      });
    });

    it('should update permissions when provided', async () => {
      // Arrange
      const mockPermissions = [
        { id: 1, name: 'program:write' } as unknown as PermissionEntity,
        { id: 2, name: 'program:read' } as unknown as PermissionEntity,
      ];
      const updateData = {
        permissions: ['program:write', 'program:read'] as any,
      };

      jest
        .spyOn(permissionRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(mockPermissions[0])
        .mockResolvedValueOnce(mockPermissions[1]);

      const freshMockRole: Partial<UserRoleEntity> = {
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      };
      const expectedRole = {
        ...freshMockRole,
        permissions: mockPermissions,
      };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(permissionRepository.findOneByOrFail).toHaveBeenCalledTimes(2);
      expect(permissionRepository.findOneByOrFail).toHaveBeenNthCalledWith(1, {
        name: 'program:write',
      });
      expect(permissionRepository.findOneByOrFail).toHaveBeenNthCalledWith(2, {
        name: 'program:read',
      });
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: ['program:write', 'program:read'],
      });
    });

    it('should update all fields when all are provided', async () => {
      // Arrange
      const mockPermissions = [
        { id: 1, name: 'program:write' } as unknown as PermissionEntity,
      ];
      const updateData = {
        label: 'New Label',
        description: 'New Description',
        permissions: ['program:write'] as any,
      };

      jest
        .spyOn(permissionRepository, 'findOneByOrFail')
        .mockResolvedValueOnce(mockPermissions[0]);

      const expectedRole = {
        ...mockExistingRole,
        label: 'New Label',
        description: 'New Description',
        permissions: mockPermissions,
      };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'New Label',
        description: 'New Description',
        permissions: ['program:write'],
      });
    });

    it('should not update fields when they are not provided', async () => {
      // Arrange
      const updateData = {}; // Empty update
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
      const permissionSpy = jest.spyOn(permissionRepository, 'findOneByOrFail');

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(mockExistingRole);
      expect(permissionSpy).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      });
    });

    it('should handle permission repository errors', async () => {
      // Arrange
      const updateData = { permissions: ['invalid-permission'] as any };
      jest
        .spyOn(permissionRepository, 'findOneByOrFail')
        .mockRejectedValue(new Error('Permission not found'));

      // Act & Assert
      await expect(
        service.updateUserRole(userRoleId, updateData),
      ).rejects.toThrow('Permission not found');

      expect(permissionRepository.findOneByOrFail).toHaveBeenCalledWith({
        name: 'invalid-permission',
      });
    });
  });

  describe('deleteUserRole', () => {
    const userRoleId = 1;
    const mockExistingRole: Partial<UserRoleEntity> = {
      id: userRoleId,
      role: 'test-role',
      label: 'Test Role',
      description: 'Test Description',
      permissions: [],
    };

    beforeEach(() => {
      // Mock the private findRoleOrThrow method by spying on userRoleRepository.findOneBy
      jest
        .spyOn(userRoleRepository, 'findOneBy')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
      jest
        .spyOn(userRoleRepository, 'remove')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
    });

    it('should throw HttpException when role is not found', async () => {
      // Arrange
      jest.spyOn(userRoleRepository, 'findOneBy').mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteUserRole(userRoleId)).rejects.toThrow(
        new HttpException('Role not found', HttpStatus.NOT_FOUND),
      );

      expect(userRoleRepository.remove).not.toHaveBeenCalled();
    });

    it('should successfully delete an existing role', async () => {
      // Act
      const result = await service.deleteUserRole(userRoleId);

      // Assert
      expect(userRoleRepository.remove).toHaveBeenCalledWith(mockExistingRole);
      expect(result).toMatchObject({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      });
    });

    it('should handle repository remove errors', async () => {
      // Arrange
      const removeError = new Error('Database error during deletion');
      jest.spyOn(userRoleRepository, 'remove').mockRejectedValue(removeError);

      // Act & Assert
      await expect(service.deleteUserRole(userRoleId)).rejects.toThrow(
        'Database error during deletion',
      );

      expect(userRoleRepository.remove).toHaveBeenCalledWith(mockExistingRole);
    });

    it('should return the deleted role data in the correct format', async () => {
      // Arrange
      const mockDeletedRole = {
        ...mockExistingRole,
      } as UserRoleEntity;

      jest
        .spyOn(userRoleRepository, 'remove')
        .mockResolvedValue(mockDeletedRole);

      // Act
      const result = await service.deleteUserRole(userRoleId);

      // Assert
      expect(result).toHaveProperty('id', userRoleId);
      expect(result).toHaveProperty('role', 'test-role');
      expect(result).toHaveProperty('label', 'Test Role');
      expect(result).toHaveProperty('description', 'Test Description');
      expect(result).toHaveProperty('permissions', []);
    });
  });

  describe('updatePassword', () => {
    const mockUpdatePasswordDto = {
      username: 'test@example.com',
      password: 'currentPassword',
      newPassword: 'newPassword123',
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'save').mockClear();
    });

    it('should throw HttpException when current password is incorrect', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'test@example.com',
        password: 'wrongHashedPassword',
        salt: 'salt',
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      // Mock the createQueryBuilder chain - first call for salt check returns user, second returns null for password mismatch
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(mockUser) // First call for salt check succeeds
          .mockResolvedValueOnce(null), // Second call for password verification fails
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      // Act & Assert
      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow(
        new HttpException(
          'Your password was incorrect.',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update password when current password is correct', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'test@example.com',
        password: 'currentHashedPassword',
        salt: 'currentSalt',
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      // Mock the createQueryBuilder chain for password verification
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(mockUser) // First call for salt check succeeds
          .mockResolvedValueOnce(mockUser), // Second call for password verification succeeds
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const expectedUpdatedUser = {
        ...mockUser,
        salt: expect.any(String),
        password: expect.any(String),
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);

      // Mock findOneOrFail for buildPermissionsObject
      const mockUserWithAssignments = {
        ...mockUser,
        programAssignments: [],
      };
      jest
        .spyOn(userRepository, 'findOneOrFail')
        .mockResolvedValue(mockUserWithAssignments as any);

      // Act
      const result = await service.updatePassword(mockUpdatePasswordDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'test@example.com',
          salt: expect.any(String),
          password: expect.any(String),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        username: 'test@example.com',
        password: 'currentHashedPassword',
        salt: 'currentSalt',
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);

      // Mock the createQueryBuilder chain for password verification
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(mockUser) // First call for salt check succeeds
          .mockResolvedValueOnce(mockUser), // Second call for password verification succeeds
      };
      jest
        .spyOn(userRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const saveError = new Error('Database save error');
      jest.spyOn(userRepository, 'save').mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow('Database save error');

      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const mockUpdateUserDto = {
      id: 1,
      isOrganizationAdmin: true,
      displayName: 'Updated Name',
      isEntraUser: false,
      lastLogin: new Date('2023-01-01'),
    };

    const mockUserEntity: Partial<UserEntity> = {
      id: 1,
      username: 'test@example.com',
      isOrganizationAdmin: false,
      displayName: 'Old Name',
      isEntraUser: true,
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'save').mockClear();
    });

    it('should throw HttpException when user is not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUser(mockUpdateUserDto)).rejects.toThrow(
        new HttpException(
          { errors: { User: ' not found' } },
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update user when user exists', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserEntity as UserEntity);
      const expectedUpdatedUser = {
        ...mockUserEntity,
        ...mockUpdateUserDto,
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);

      // Act
      const result = await service.updateUser(mockUpdateUserDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(expectedUpdatedUser);
      expect(result).toEqual(expectedUpdatedUser);
    });

    it('should update only provided fields and keep existing ones', async () => {
      // Arrange
      const partialUpdateDto = {
        id: 1,
        displayName: 'New Display Name',
      };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserEntity as UserEntity);

      const expectedUpdatedUser = {
        ...mockUserEntity,
        displayName: 'New Display Name',
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);

      // Act
      const result = await service.updateUser(partialUpdateDto);

      // Assert
      expect(result.displayName).toBe('New Display Name');
      expect(result.id).toBe(1);
    });

    it('should handle repository save errors', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserEntity as UserEntity);
      const saveError = new Error('Database save error');
      jest.spyOn(userRepository, 'save').mockRejectedValue(saveError);

      // Act & Assert
      await expect(service.updateUser(mockUpdateUserDto)).rejects.toThrow(
        'Database save error',
      );

      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should update all fields when all are provided', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserEntity as UserEntity);
      const expectedUpdatedUser = {
        ...mockUserEntity,
        isOrganizationAdmin: true,
        displayName: 'Updated Name',
        isEntraUser: false,
        lastLogin: mockUpdateUserDto.lastLogin,
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);

      // Act
      const result = await service.updateUser(mockUpdateUserDto);

      // Assert
      expect(result.isOrganizationAdmin).toBe(true);
      expect(result.displayName).toBe('Updated Name');
      expect(result.isEntraUser).toBe(false);
      expect(result.lastLogin).toEqual(mockUpdateUserDto.lastLogin);
    });

    it('should handle empty update data correctly', async () => {
      // Arrange
      const emptyUpdateDto = { id: 1 };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUserEntity as UserEntity);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(mockUserEntity as UserEntity);

      // Act
      const result = await service.updateUser(emptyUpdateDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(mockUserEntity);
      expect(result).toEqual(mockUserEntity);
    });
  });

  describe('changePasswordWithoutCurrentPassword', () => {
    const mockChangePasswordDto = {
      username: 'test@example.com',
    };

    const mockUser: Partial<UserEntity> = {
      id: 1,
      username: 'test@example.com',
      displayName: 'Test User',
      salt: 'oldSalt',
      password: 'oldHashedPassword',
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'save').mockClear();
      jest.spyOn(userEmailsService, 'send').mockClear();
    });

    it('should throw HttpException when user is not found', async () => {
      // Arrange
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePasswordWithoutCurrentPassword(mockChangePasswordDto),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(userEmailsService.send).not.toHaveBeenCalled();
    });

    it('should throw HttpException when user has no username', async () => {
      // Arrange
      const userWithoutUsername = { ...mockUser, username: null };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userWithoutUsername as UserEntity);

      // Act & Assert
      await expect(
        service.changePasswordWithoutCurrentPassword(mockChangePasswordDto),
      ).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND),
      );

      expect(userRepository.save).not.toHaveBeenCalled();
      expect(userEmailsService.send).not.toHaveBeenCalled();
    });

    it('should successfully change password and send email when user exists', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);
      const expectedUpdatedUser = {
        ...mockUser,
        salt: expect.any(String),
        password: expect.any(String),
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);
      jest.spyOn(userEmailsService, 'send').mockResolvedValue();

      // Act
      await service.changePasswordWithoutCurrentPassword(mockChangePasswordDto);

      // Assert
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'test@example.com',
          salt: expect.any(String),
          password: expect.any(String),
        }),
      );
      expect(userEmailsService.send).toHaveBeenCalled();
    });

    it('should send password reset email with correct data', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(mockUser as UserEntity);
      jest.spyOn(userEmailsService, 'send').mockResolvedValue();

      // Act
      await service.changePasswordWithoutCurrentPassword(mockChangePasswordDto);

      // Assert
      expect(userEmailsService.send).toHaveBeenCalledWith({
        userEmailInput: {
          email: 'test@example.com',
          displayName: 'Test User',
          password: expect.any(String),
        },
        userEmailType: UserEmailType.passwordReset,
      });
    });

    it('should use default display name when user displayName is null', async () => {
      // Arrange
      const userWithoutDisplayName = { ...mockUser, displayName: null };
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(userWithoutDisplayName as unknown as UserEntity);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(userWithoutDisplayName as unknown as UserEntity);
      jest.spyOn(userEmailsService, 'send').mockResolvedValue();

      // Act
      await service.changePasswordWithoutCurrentPassword(mockChangePasswordDto);

      // Assert
      expect(userEmailsService.send).toHaveBeenCalledWith({
        userEmailInput: {
          email: 'test@example.com',
          displayName: 'Madam/Sir',
          password: expect.any(String),
        },
        userEmailType: UserEmailType.passwordReset,
      });
    });

    it('should handle repository save errors', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);
      const saveError = new Error('Database save error');
      jest.spyOn(userRepository, 'save').mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        service.changePasswordWithoutCurrentPassword(mockChangePasswordDto),
      ).rejects.toThrow('Database save error');

      expect(userRepository.save).toHaveBeenCalled();
      expect(userEmailsService.send).not.toHaveBeenCalled();
    });

    it('should handle email service errors', async () => {
      // Arrange
      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(mockUser as UserEntity);
      const emailError = new Error('Email service error');
      jest.spyOn(userEmailsService, 'send').mockRejectedValue(emailError);

      // Act & Assert
      await expect(
        service.changePasswordWithoutCurrentPassword(mockChangePasswordDto),
      ).rejects.toThrow('Email service error');

      expect(userRepository.save).toHaveBeenCalled();
      expect(userEmailsService.send).toHaveBeenCalled();
    });
  });
});
