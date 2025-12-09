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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in tests
  let permissionRepository: Repository<PermissionEntity>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in tests
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
});
