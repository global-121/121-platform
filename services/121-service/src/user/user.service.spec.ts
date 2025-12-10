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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in tests
  let programRepository: Repository<ProgramEntity>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in tests
  let assignmentRepository: Repository<ProgramAidworkerAssignmentEntity>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in tests
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
    programRepository = module.get<Repository<ProgramEntity>>(
      getRepositoryToken(ProgramEntity),
    );
    assignmentRepository = module.get<
      Repository<ProgramAidworkerAssignmentEntity>
    >(getRepositoryToken(ProgramAidworkerAssignmentEntity));
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

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);

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

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);

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

      jest
        .spyOn(userRepository, 'findOne')
        .mockResolvedValue(mockUser as UserEntity);

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
});
