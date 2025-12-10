import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { UserService } from '@121-service/src/user/user.service';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  let permissionRepository: Repository<PermissionEntity>;
  let userRoleRepository: Repository<UserRoleEntity>;

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

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: expect.anything() },
        relations: [
          'programAssignments',
          'programAssignments.program',
          'programAssignments.roles',
          'programAssignments.roles.permissions',
        ],
      });
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
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: expect.anything() },
        relations: [
          'programAssignments',
          'programAssignments.program',
          'programAssignments.roles',
          'programAssignments.roles.permissions',
        ],
      });
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
      // Mock the private findRoleOrThrow method by spying on userRoleRepository.findOneBy
      jest
        .spyOn(userRoleRepository, 'findOneBy')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
      jest.spyOn(permissionRepository, 'findOneByOrFail').mockClear();
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

      expect(userRoleRepository.findOneBy).toHaveBeenCalledWith({
        id: userRoleId,
      });
    });

    it('should update only the label when provided', async () => {
      // Arrange
      const updateData = { label: 'Updated Label' };
      const expectedRole = { ...mockExistingRole, label: 'Updated Label' };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'Updated Label',
        description: 'Test Description',
        permissions: [],
      });

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.findOneBy).toHaveBeenCalledWith({
        id: userRoleId,
      });
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result.label).toBe('Updated Label');
    });

    it('should update only the description when provided', async () => {
      // Arrange
      const updateData = { description: 'Updated Description' };
      const expectedRole = {
        ...mockExistingRole,
        description: 'Updated Description',
      };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Updated Description',
        permissions: [],
      });

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result.description).toBe('Updated Description');
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

      const expectedRole = {
        ...mockExistingRole,
        permissions: mockPermissions,
      };
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(expectedRole as UserRoleEntity);
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: ['program:write', 'program:read'],
      });

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
      expect(result.permissions).toEqual(['program:write', 'program:read']);
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
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'New Label',
        description: 'New Description',
        permissions: ['program:write'],
      });

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(expectedRole);
      expect(result.label).toBe('New Label');
      expect(result.description).toBe('New Description');
      expect(result.permissions).toEqual(['program:write']);
    });

    it('should not update fields when they are not provided', async () => {
      // Arrange
      const updateData = {}; // Empty update
      jest
        .spyOn(userRoleRepository, 'save')
        .mockResolvedValue(mockExistingRole as UserRoleEntity);
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      });

      // Act
      const result = await service.updateUserRole(userRoleId, updateData);

      // Assert
      expect(userRoleRepository.save).toHaveBeenCalledWith(mockExistingRole);
      expect(permissionRepository.findOneByOrFail).not.toHaveBeenCalled();
      expect(result.label).toBe('Test Role');
      expect(result.description).toBe('Test Description');
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

      expect(userRoleRepository.findOneBy).toHaveBeenCalledWith({
        id: userRoleId,
      });
      expect(userRoleRepository.remove).not.toHaveBeenCalled();
    });

    it('should successfully delete an existing role', async () => {
      // Arrange
      const expectedResponse = {
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      };

      jest
        .spyOn(service as any, 'getUserRoleResponse')
        .mockReturnValue(expectedResponse);

      // Act
      const result = await service.deleteUserRole(userRoleId);

      // Assert
      expect(userRoleRepository.findOneBy).toHaveBeenCalledWith({
        id: userRoleId,
      });
      expect(userRoleRepository.remove).toHaveBeenCalledWith(mockExistingRole);
      expect(result).toEqual(expectedResponse);
    });

    it('should call getUserRoleResponse with the deleted role', async () => {
      // Arrange
      const getUserRoleResponseSpy = jest
        .spyOn(service as any, 'getUserRoleResponse')
        .mockReturnValue({
          id: userRoleId,
          role: 'test-role',
          label: 'Test Role',
          description: 'Test Description',
          permissions: [],
        });

      // Act
      await service.deleteUserRole(userRoleId);

      // Assert
      expect(getUserRoleResponseSpy).toHaveBeenCalledWith(mockExistingRole);
    });

    it('should handle repository remove errors', async () => {
      // Arrange
      const removeError = new Error('Database error during deletion');
      jest.spyOn(userRoleRepository, 'remove').mockRejectedValue(removeError);

      // Act & Assert
      await expect(service.deleteUserRole(userRoleId)).rejects.toThrow(
        'Database error during deletion',
      );

      expect(userRoleRepository.findOneBy).toHaveBeenCalledWith({
        id: userRoleId,
      });
      expect(userRoleRepository.remove).toHaveBeenCalledWith(mockExistingRole);
    });

    it('should return the role data in the response format', async () => {
      // Arrange
      const mockDeletedRole = {
        ...mockExistingRole,
        id: userRoleId,
      } as UserRoleEntity;

      jest
        .spyOn(userRoleRepository, 'remove')
        .mockResolvedValue(mockDeletedRole);
      jest.spyOn(service as any, 'getUserRoleResponse').mockReturnValue({
        id: userRoleId,
        role: 'test-role',
        label: 'Test Role',
        description: 'Test Description',
        permissions: [],
      });

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

    const mockUserEntity: Partial<UserEntity> = {
      id: 1,
      username: 'test@example.com',
      password: 'hashedOldPassword',
      salt: 'oldSalt',
    };

    beforeEach(() => {
      jest.spyOn(service as any, 'generateSalt').mockReturnValue('newSalt');
      jest
        .spyOn(service as any, 'hashPassword')
        .mockReturnValue('hashedNewPassword');
      jest.spyOn(userRepository, 'save').mockClear();
      jest.spyOn(service as any, 'matchPassword').mockClear();
      jest.spyOn(service as any, 'buildUserRO').mockClear();
    });

    it('should throw HttpException when current password is incorrect', async () => {
      // Arrange
      jest.spyOn(service as any, 'matchPassword').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow(
        new HttpException(
          'Your password was incorrect.',
          HttpStatus.UNAUTHORIZED,
        ),
      );

      expect(service['matchPassword']).toHaveBeenCalledWith(
        mockUpdatePasswordDto,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update password when current password is correct', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'matchPassword')
        .mockResolvedValue(mockUserEntity);
      const expectedUpdatedUser = {
        ...mockUserEntity,
        salt: 'newSalt',
        password: 'hashedNewPassword',
      };
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(expectedUpdatedUser as UserEntity);

      const mockUserRO = {
        user: {
          id: 1,
          username: 'test@example.com',
          permissions: {},
        },
      };
      jest.spyOn(service as any, 'buildUserRO').mockResolvedValue(mockUserRO);

      // Act
      const result = await service.updatePassword(mockUpdatePasswordDto);

      // Assert
      expect(service['matchPassword']).toHaveBeenCalledWith(
        mockUpdatePasswordDto,
      );
      expect(service['generateSalt']).toHaveBeenCalled();
      expect(service['hashPassword']).toHaveBeenCalledWith(
        'newPassword123',
        'newSalt',
      );
      expect(userRepository.save).toHaveBeenCalledWith(expectedUpdatedUser);
      expect(service['buildUserRO']).toHaveBeenCalledWith(expectedUpdatedUser);
      expect(result).toEqual(mockUserRO);
    });

    it('should generate new salt and hash new password correctly', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'matchPassword')
        .mockResolvedValue(mockUserEntity);
      jest.spyOn(userRepository, 'save').mockResolvedValue({} as UserEntity);
      jest.spyOn(service as any, 'buildUserRO').mockResolvedValue({} as any);

      // Act
      await service.updatePassword(mockUpdatePasswordDto);

      // Assert
      expect(service['generateSalt']).toHaveBeenCalledTimes(1);
      expect(service['hashPassword']).toHaveBeenCalledWith(
        'newPassword123',
        'newSalt',
      );
    });

    it('should handle repository save errors', async () => {
      // Arrange
      jest
        .spyOn(service as any, 'matchPassword')
        .mockResolvedValue(mockUserEntity);
      const saveError = new Error('Database save error');
      jest.spyOn(userRepository, 'save').mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow('Database save error');

      expect(service['matchPassword']).toHaveBeenCalledWith(
        mockUpdatePasswordDto,
      );
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
      jest.spyOn(service as any, 'findById').mockClear();
    });

    it('should throw HttpException when user is not found', async () => {
      // Arrange
      jest.spyOn(service as any, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateUser(mockUpdateUserDto)).rejects.toThrow(
        new HttpException('User not found.', HttpStatus.NOT_FOUND),
      );

      expect(service['findById']).toHaveBeenCalledWith(mockUpdateUserDto.id);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should successfully update user when user exists', async () => {
      // Arrange
      jest.spyOn(service as any, 'findById').mockResolvedValue(mockUserEntity);
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
      expect(service['findById']).toHaveBeenCalledWith(mockUpdateUserDto.id);
      expect(userRepository.save).toHaveBeenCalledWith(expectedUpdatedUser);
      expect(result).toEqual(expectedUpdatedUser);
    });

    it('should update only provided fields and keep existing ones', async () => {
      // Arrange
      const partialUpdateDto = {
        id: 1,
        displayName: 'New Display Name',
      };
      jest.spyOn(service as any, 'findById').mockResolvedValue(mockUserEntity);

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
      // Note: The function copies all fields from DTO, so only id and displayName are set
      expect(result.id).toBe(1);
    });

    it('should handle repository save errors', async () => {
      // Arrange
      jest.spyOn(service as any, 'findById').mockResolvedValue(mockUserEntity);
      const saveError = new Error('Database save error');
      jest.spyOn(userRepository, 'save').mockRejectedValue(saveError);

      // Act & Assert
      await expect(service.updateUser(mockUpdateUserDto)).rejects.toThrow(
        'Database save error',
      );

      expect(service['findById']).toHaveBeenCalledWith(mockUpdateUserDto.id);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should update all fields when all are provided', async () => {
      // Arrange
      jest.spyOn(service as any, 'findById').mockResolvedValue(mockUserEntity);
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
      jest.spyOn(service as any, 'findById').mockResolvedValue(mockUserEntity);
      jest
        .spyOn(userRepository, 'save')
        .mockResolvedValue(mockUserEntity as UserEntity);

      // Act
      const result = await service.updateUser(emptyUpdateDto);

      // Assert
      expect(service['findById']).toHaveBeenCalledWith(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockUserEntity);
      expect(result).toEqual(mockUserEntity);
    });
  });
});
