import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { AuthenticatedUserParameters } from '@121-service/src/guards/authenticated-user.decorator';
import { CookieJwtStrategy } from '@121-service/src/strategies/cookie-jwt.strategy';
import { UserRequestData } from '@121-service/src/user/user.interface';
import { UserAccess, UserService } from '@121-service/src/user/user.service';
import { UserAccessGroupAssignmentsService } from '@121-service/src/user/user-access-group-assignments/user-access-group-assignments.service';

describe('CookieJwtStrategy', () => {
  let strategy: CookieJwtStrategy;
  let userService: jest.Mocked<UserService>;
  let userAccessGroupAssignmentsService: jest.Mocked<UserAccessGroupAssignmentsService>;

  const payload = {
    id: 1,
    username: 'Test@Example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
    admin: false,
    isOrganizationAdmin: false,
  } as UserRequestData;

  const user = { id: 1, programAssignments: [] } as unknown as UserAccess;

  const createRequest = ({
    params,
  }: {
    params: Record<string, string>;
  }): Record<string, unknown> => ({
    params,
    authenticationParameters: {
      isGuarded: true,
    } as AuthenticatedUserParameters,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CookieJwtStrategy,
        {
          provide: ModuleRef,
          useValue: { resolve: jest.fn(), get: jest.fn() },
        },
      ],
    }).compile();

    strategy = module.get(CookieJwtStrategy);

    userService = {
      findUserAccessByUsernameOrThrow: jest.fn().mockResolvedValue(user),
      getScopeForUser: jest.fn(),
    } as unknown as jest.Mocked<UserService>;
    userAccessGroupAssignmentsService = {
      getAccessGroupsForUser: jest.fn(),
    } as unknown as jest.Mocked<UserAccessGroupAssignmentsService>;
    strategy['userService'] = userService;
    strategy['userAccessGroupAssignmentsService'] =
      userAccessGroupAssignmentsService;
  });

  it('should look up the user by lowercased username', async () => {
    // Act
    await strategy.validate(createRequest({ params: {} }), payload);

    // Assert
    expect(userService.findUserAccessByUsernameOrThrow).toHaveBeenCalledWith({
      username: 'test@example.com',
    });
  });

  it('should return the scope and access groups of the program when a programId is provided', async () => {
    // Arrange
    const accessGroups = [
      { accessGroupLevelId: 3, programRegistrationAttributeId: 7, value: 'kisumu' },
    ];
    userService.getScopeForUser.mockReturnValue('program-scope');
    userAccessGroupAssignmentsService.getAccessGroupsForUser.mockReturnValue(
      accessGroups,
    );

    // Act
    const result = await strategy.validate(
      createRequest({ params: { programId: '123' } }),
      payload,
    );

    // Assert
    expect(
      userAccessGroupAssignmentsService.getAccessGroupsForUser,
    ).toHaveBeenCalledWith({
      programAssignments: user.programAssignments,
      programId: '123',
    });
    expect(result).toEqual({
      id: payload.id,
      username: 'test@example.com',
      exp: payload.exp,
      admin: payload.admin,
      scope: 'program-scope',
      accessGroups,
      isOrganizationAdmin: payload.isOrganizationAdmin,
    });
  });

  it('should return an empty scope and no access groups when no programId is provided', async () => {
    // Act
    const result = await strategy.validate(
      createRequest({ params: {} }),
      payload,
    );

    // Assert
    expect(userService.getScopeForUser).not.toHaveBeenCalled();
    expect(
      userAccessGroupAssignmentsService.getAccessGroupsForUser,
    ).not.toHaveBeenCalled();
    expect(result).toMatchObject({ scope: '', accessGroups: [] });
  });

  it('should throw when the user no longer exists', async () => {
    // Arrange
    userService.findUserAccessByUsernameOrThrow.mockRejectedValue(
      new HttpException({ errors: { User: ' not found' } }, HttpStatus.NOT_FOUND),
    );

    // Act & Assert
    await expect(
      strategy.validate(createRequest({ params: {} }), payload),
    ).rejects.toBeHttpExceptionWithStatus(HttpStatus.NOT_FOUND);
  });
});
