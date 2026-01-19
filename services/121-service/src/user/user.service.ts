import { HttpStatus, Inject, Injectable, Scope } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { Equal, FindOptionsRelations, In, Repository } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { DEFAULT_DISPLAY_NAME } from '@121-service/src/emails/email-constants';
import { env } from '@121-service/src/env';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/entities/program-aidworker.entity';
import { CookieNames } from '@121-service/src/shared/enum/cookie.enums';
import {
  INTERFACE_NAME_HEADER,
  InterfaceNames,
} from '@121-service/src/shared/enum/interface-names.enum';
import { PostgresStatusCodes } from '@121-service/src/shared/enum/postgres-status-codes.enum';
import { ApproverEntity } from '@121-service/src/user/approver/entities/approver.entity';
import {
  CreateProgramAssignmentDto,
  UpdateProgramAssignmentDto,
} from '@121-service/src/user/dto/assign-aw-to-program.dto';
import { changePasswordWithoutCurrentPasswordDto } from '@121-service/src/user/dto/change-password-without-current-password.dto';
import { CookieSettingsDto } from '@121-service/src/user/dto/cookie-settings.dto';
import { CreateUsersDto } from '@121-service/src/user/dto/create-user.dto';
import { CreateUserRoleDto } from '@121-service/src/user/dto/create-user-role.dto';
import { FindUserReponseDto } from '@121-service/src/user/dto/find-user-response.dto';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { LoginResponseDto } from '@121-service/src/user/dto/login-response.dto';
import { LoginUserDto } from '@121-service/src/user/dto/login-user.dto';
import {
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '@121-service/src/user/dto/update-user.dto';
import { UpdateUserRoleDto } from '@121-service/src/user/dto/update-user-role.dto';
import {
  AssignmentResponseDTO,
  UserRoleResponseDTO,
} from '@121-service/src/user/dto/userrole-response.dto';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { UserData, UserRO } from '@121-service/src/user/user.interface';
import { UserEmailType } from '@121-service/src/user/user-emails/enum/user-email-type.enum';
import { UserEmailInput } from '@121-service/src/user/user-emails/interfaces/user-email-input.interface';
import { UserEmailsService } from '@121-service/src/user/user-emails/user-emails.service';
import { isSameAsString } from '@121-service/src/utils/comparison.helper';
const tokenExpirationDays = 14;

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(PermissionEntity)
  private readonly permissionRepository: Repository<PermissionEntity>;
  @InjectRepository(UserRoleEntity)
  private readonly userRoleRepository: Repository<UserRoleEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramAidworkerAssignmentEntity)
  private readonly assignmentRepository: Repository<ProgramAidworkerAssignmentEntity>;
  @InjectRepository(ApproverEntity)
  private readonly approverRepository: Repository<ApproverEntity>;

  public constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly userEmailsService: UserEmailsService,
  ) {}

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const userEntity = await this.matchPassword(loginUserDto);

    if (!userEntity) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const token = this.generateJWT(userEntity);
    const user = await this.buildUserRO(userEntity);

    const cookieSettings = this.buildCookieByRequest(token);
    userEntity.lastLogin = new Date();
    await this.userRepository.save(userEntity);
    return { userRo: user, cookieSettings, token };
  }

  public async canActivate(
    permissions: PermissionEnum[],
    programId: string | number,
    userId: number,
  ): Promise<boolean> {
    // if programId is not a number then it is not a programId so a user does not have access
    // the query builder cannot handle this so we need to check it here
    if (isNaN(Number(programId))) {
      return false;
    }
    const results = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.programAssignments', 'assignment')
      .leftJoin('assignment.program', 'program')
      .leftJoin('assignment.roles', 'roles')
      .leftJoin('roles.permissions', 'permissions')
      .where('user.id = :userId', { userId })
      .andWhere('program.id = :programId', { programId })
      .andWhere('permissions.name IN (:...permissions)', {
        permissions,
      })
      .getCount();
    return results === 1;
  }

  public async getUserRoles(): Promise<UserRoleResponseDTO[]> {
    const userRoles = await this.userRoleRepository.find({
      relations: ['permissions'],
    });

    return userRoles.map((userRole) => this.getUserRoleResponse(userRole));
  }

  public async getProgramScopeIdsUserHasPermission(
    userId: number,
    permission: PermissionEnum,
  ): Promise<{ programId: number; scope: string }[]> {
    const user = await this.findUserProgramAssignmentsOrThrow(userId);
    const programIdScopeObjects: { programId: number; scope: string }[] = [];
    for (const assignment of user.programAssignments) {
      for (const role of assignment.roles) {
        if (role.permissions.map((p) => p.name).includes(permission)) {
          const programIdScopeObject = {
            programId: assignment.programId,
            scope: assignment.scope,
          };

          programIdScopeObjects.push(programIdScopeObject);
        }
      }
    }
    return programIdScopeObjects;
  }

  // TODO: REFACTOR: the Controller should throw the HTTP Status Code
  public async findUserProgramAssignmentsOrThrow(
    userId: number,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
      relations: [
        'programAssignments',
        'programAssignments.program',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
      ],
    });
    if (
      !user ||
      !user.programAssignments ||
      user.programAssignments.length === 0
    ) {
      const errors = 'User not found or no assigned programs';
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  private getUserRoleResponse(userRole: UserRoleEntity): UserRoleResponseDTO {
    const userRoleResponse: UserRoleResponseDTO = {
      id: userRole.id,
      role: userRole.role,
      label: userRole.label,
      description: userRole.description,
    };
    if (userRole.permissions) {
      userRoleResponse.permissions = userRole.permissions.map(
        (permission) => permission.name,
      );
    }
    return userRoleResponse;
  }

  public async addUserRole(
    userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    const existingRole = await this.userRoleRepository.findOne({
      where: { role: Equal(userRoleData.role) },
    });
    if (existingRole) {
      throw new HttpException(
        `Role already exists: ${userRoleData.role}`,
        HttpStatus.CONFLICT,
      );
    }

    const userRoleEntity = new UserRoleEntity();
    userRoleEntity.role = userRoleData.role;
    userRoleEntity.label = userRoleData.label;
    userRoleEntity.description = userRoleData.description;
    const permissionEntities: PermissionEntity[] = [];
    for (const permission of userRoleData.permissions) {
      try {
        const permissionEntity =
          await this.permissionRepository.findOneByOrFail({
            name: permission,
          });
        permissionEntities.push(permissionEntity);
      } catch (e) {
        throw new HttpException(
          `Permission not valid: ${permission}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    userRoleEntity.permissions = permissionEntities;

    const createdUserRole = await this.userRoleRepository.save(userRoleEntity);
    return this.getUserRoleResponse(createdUserRole);
  }

  public async updateUserRole(
    userRoleId: number,
    userRoleData: UpdateUserRoleDto,
  ): Promise<UserRoleResponseDTO> {
    const existingRole = await this.findRoleOrThrow(userRoleId);

    if (userRoleData.label) {
      existingRole.label = userRoleData.label;
    }

    if (userRoleData.description) {
      existingRole.description = userRoleData.description;
    }

    if (userRoleData.permissions) {
      const permissionEntities: PermissionEntity[] = [];
      for (const permission of userRoleData.permissions) {
        permissionEntities.push(
          await this.permissionRepository.findOneByOrFail({
            name: permission,
          }),
        );
      }
      existingRole.permissions = permissionEntities;
    }

    const savedUserRole = await this.userRoleRepository.save(existingRole);
    return this.getUserRoleResponse(savedUserRole);
  }

  public async deleteUserRole(
    userRoleId: number,
  ): Promise<UserRoleResponseDTO> {
    const existingRole = await this.findRoleOrThrow(userRoleId);
    const deletedUserRole = await this.userRoleRepository.remove(existingRole);
    return this.getUserRoleResponse(deletedUserRole);
  }

  private async findRoleOrThrow(userRoleId: number): Promise<UserRoleEntity> {
    const existingRole = await this.userRoleRepository.findOneBy({
      id: userRoleId,
    });
    if (!existingRole) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
    return existingRole;
  }

  public async createUsers(createUsersDto: CreateUsersDto): Promise<void> {
    for (const user of createUsersDto.users) {
      const password = this.generateStrongPassword();

      const userEntity = await this.create(
        user.username,
        user.displayName,
        password,
        UserType.aidWorker,
      );

      if (!userEntity.username) {
        throw new Error('username is missing');
      }

      const userEmailInput: UserEmailInput = {
        email: userEntity.username,
        displayName: userEntity.displayName ?? DEFAULT_DISPLAY_NAME,
        password,
      };

      const userEmailType: UserEmailType = env.USE_SSO_AZURE_ENTRA
        ? UserEmailType.accountCreatedForSSO
        : UserEmailType.accountCreated;

      await this.userEmailsService.send({
        userEmailInput,
        userEmailType,
      });
    }
  }

  public async create(
    username: string,
    displayName: string | null,
    password: string,
    userType: UserType,
    isEntraUser = false,
  ): Promise<UserEntity> {
    username = username.toLowerCase();
    // check uniqueness of email
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username });

    const user = await qb.getOne();

    if (user) {
      const errors = { username: `Username: '${username}' must be unique.` };
      throw new HttpException(
        { message: 'Input data validation failed', errors },
        HttpStatus.BAD_REQUEST,
      );
    }

    // create new user
    const newUser = new UserEntity();
    newUser.username = username;
    newUser.password = password;
    newUser.userType = userType;
    newUser.isEntraUser = isEntraUser;
    newUser.displayName = displayName || username.split('@')[0];
    return await this.userRepository.save(newUser);
  }

  public async updatePassword(dto: UpdateUserPasswordDto): Promise<UserRO> {
    const userEntity = await this.matchPassword(dto);

    if (!userEntity) {
      throw new HttpException(
        'Your password was incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const updated = userEntity;
    updated.salt = this.generateSalt();
    updated.password = this.hashPassword(dto.newPassword, updated.salt);
    await this.userRepository.save(updated);
    return await this.buildUserRO(updated);
  }

  public async updateUser(userData: UpdateUserDto): Promise<UserEntity> {
    const userEntity = await this.findById(userData.id);
    if (!userEntity) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }
    for (const key of Object.keys(userData)) {
      userEntity[key] = userData[key];
    }

    return await this.userRepository.save(userEntity);
  }

  public async assignAidworkerToProgram(
    programId: number,
    userId: number,
    assignAidworkerToProgram: CreateProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
      relations: [
        'programAssignments',
        'programAssignments.program',
        'programAssignments.roles',
      ],
    });
    if (!user) {
      const errors = { User: `user with userId ${userId} not found` };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    if (!program) {
      const errors = {
        Program: `program with programId ${programId} not found`,
      };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const newRoles = await this.userRoleRepository.find({
      where: {
        role: In(assignAidworkerToProgram.roles),
      },
    });
    if (newRoles.length !== assignAidworkerToProgram.roles.length) {
      const errors = { Roles: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const scope = assignAidworkerToProgram.scope
      ? assignAidworkerToProgram.scope.toLowerCase()
      : '';

    const response = new AssignmentResponseDTO();
    response.programId = programId;
    response.userId = userId;
    response.scope = scope;
    // if already assigned: add roles and scope to program assignment
    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === programId) {
        if (scope) {
          await this.checkNoApproverOrThrow({
            programAssignmentId: programAssignment.id,
          });
        }
        programAssignment.roles = newRoles;
        programAssignment.scope = scope;
        await this.assignmentRepository.save(programAssignment);
        response.roles = programAssignment.roles.map((role) =>
          this.getUserRoleResponse(role),
        );
        return response;
      }
    }

    // if not assigned to program: create new assignment
    await this.assignmentRepository.save({
      user: { id: user.id },
      program: { id: program.id },
      roles: newRoles,
      scope,
    });
    response.roles = newRoles.map((role) => this.getUserRoleResponse(role));
    return response;
  }

  private async checkNoApproverOrThrow({
    programAssignmentId,
  }: {
    programAssignmentId: number;
  }): Promise<void> {
    const existingApprover = await this.approverRepository.findOne({
      where: {
        programAidworkerAssignmentId: Equal(programAssignmentId),
      },
    });
    if (existingApprover) {
      throw new HttpException(
        'Cannot add scope to assignment because user is an approver for this program. Remove approver from program first (if intended) and retry.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async deleteAidworkerRolesOrAssignment({
    programId,
    userId,
    roleNamesToDelete,
  }: {
    programId: number;
    userId: number;
    roleNamesToDelete?: DefaultUserRole[] | string[];
  }): Promise<AssignmentResponseDTO | void> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
      relations: [
        'programAssignments',
        'programAssignments.program',
        'programAssignments.roles',
      ],
    });
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const rolesToDelete = await this.userRoleRepository.find({
      where: { role: In(roleNamesToDelete || []) },
    });
    if (
      roleNamesToDelete &&
      rolesToDelete.length !== roleNamesToDelete.length
    ) {
      const errors = { Roles: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === programId) {
        const rolesToKeep = programAssignment.roles.filter(
          (role) => !rolesToDelete.some((newRole) => newRole.id === role.id),
        );
        let resultRoles: UserRoleEntity[] = [];

        if (rolesToDelete.length === 0 || rolesToKeep.length === 0) {
          // If no roles to delete are passed OR no roles are left, delete the assignment
          await this.assignmentRepository.remove(programAssignment);
          return;
        } else if (rolesToKeep.length > 0) {
          // Keep only the roles that are not in the newRoles array
          programAssignment.roles = rolesToKeep;

          // Save the assignment with updated roles
          await this.assignmentRepository.save(programAssignment);
          resultRoles = rolesToKeep;
        }
        return {
          programId,
          userId,
          scope: programAssignment.scope,
          roles: resultRoles.map((role) => this.getUserRoleResponse(role)),
        };
      }
    }
    const errors = `User assignment for user id ${userId} to program ${programId} not found`;
    throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
  }

  public async delete(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: Equal(userId) },
      relations: ['programAssignments', 'programAssignments.roles'],
    });

    await this.assignmentRepository.remove(user.programAssignments);

    try {
      return await this.userRepository.remove(user);
    } catch (e) {
      if (isSameAsString(e.code, PostgresStatusCodes.FOREIGN_KEY_VIOLATION)) {
        throw new HttpException(
          'User cannot be removed because it is related to other entities for logging purposes',
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  public async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(id) },
      relations: [
        'programAssignments',
        'programAssignments.roles',
        'registrations',
      ],
    });

    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  public async findByUsernameOrThrow(
    username: string,
    relations?: FindOptionsRelations<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { username: Equal(username) },
      relations,
    });

    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return user;
  }

  public async getUserRoByUsernameOrThrow(
    username: string,
    tokenExpiration?: number,
  ): Promise<UserRO> {
    const user = await this.userRepository.findOne({
      where: { username: Equal(username) },
      relations: [
        'programAssignments',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
      ],
    });
    if (!user) {
      const errors = `User not found'`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return await this.buildUserRO(user, tokenExpiration);
  }

  public generateJWT(user: UserEntity): string {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + tokenExpirationDays);

    const roles = {};
    if (user.programAssignments && user.programAssignments[0]) {
      for (const programAssignment of user.programAssignments) {
        const programRoles = programAssignment.roles.map((role) => role.role);
        roles[`${programAssignment.programId}`] = programRoles;
      }
    }

    const result = jwt.sign(
      {
        id: user.id,
        username: user.username,
        exp: exp.getTime() / 1000,
        admin: user.admin,
        isOrganizationAdmin: user.isOrganizationAdmin,
      },
      env.SECRETS_121_SERVICE_SECRET,
    );

    return result;
  }

  public getInterfaceKeyByHeader(): string {
    const originInterface = this.request.headers[INTERFACE_NAME_HEADER];
    switch (originInterface) {
      case InterfaceNames.portal:
        return CookieNames.portal;
      default:
        return CookieNames.general;
    }
  }

  public getCookieSecuritySettings(): {
    sameSite: 'Strict' | 'Lax' | 'None';
    secure: boolean;
    httpOnly: boolean;
  } {
    return {
      sameSite: IS_DEVELOPMENT ? 'Lax' : 'None',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
    };
  }

  public async buildUserRO(
    user: UserEntity,
    tokenExpiration?: number,
  ): Promise<UserRO> {
    const permissions = await this.buildPermissionsObject(user.id);

    const userData: UserData = {
      id: user.id,
      username: user.username ?? undefined,
      permissions,
      isAdmin: user.admin,
      isEntraUser: user.isEntraUser,
      lastLogin: user.lastLogin ?? undefined,
      displayName: user.displayName,
      isOrganizationAdmin: user.isOrganizationAdmin,
    };

    // For SSO-users, token expiration is handled by Azure
    if (!env.USE_SSO_AZURE_ENTRA && !user.isEntraUser && tokenExpiration) {
      userData.expires = new Date(tokenExpiration * 1_000);
    }

    return { user: userData };
  }

  private async buildPermissionsObject(userId: number): Promise<any> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: Equal(userId) },
      relations: [
        'programAssignments',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
        'programAssignments.program',
      ],
    });

    const permissionsObject = {};
    if (user.programAssignments && user.programAssignments[0]) {
      for (const programAssignment of user.programAssignments) {
        let permissions: PermissionEnum[] = [];
        for (const role of programAssignment.roles) {
          const permissionNames = role.permissions.map((a) => a.name);
          permissions = [...new Set([...permissions, ...permissionNames])];
          permissionsObject[programAssignment.program.id] = permissions;
        }
      }
    }
    return permissionsObject;
  }

  private buildCookieByRequest(token: string): CookieSettingsDto {
    const tokenKey: string = this.getInterfaceKeyByHeader();
    const { sameSite, secure, httpOnly } = this.getCookieSecuritySettings();

    return {
      tokenKey,
      tokenValue: token,
      sameSite,
      secure,
      httpOnly,
      expires: new Date(Date.now() + tokenExpirationDays * 24 * 3600000),
    };
  }

  public async matchPassword(
    loginUserDto: LoginUserDto,
  ): Promise<UserEntity | null> {
    const username = loginUserDto.username.toLowerCase();
    const saltCheck = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.salt')
      .where({ username })
      .getOne();

    if (!saltCheck) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const userSalt = saltCheck.salt;

    const findOneOptions = {
      username,
      password: userSalt
        ? crypto
            .pbkdf2Sync(loginUserDto.password, userSalt, 1, 32, 'sha256')
            .toString('hex')
        : crypto.createHmac('sha256', loginUserDto.password).digest('hex'),
    };
    const userEntity = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('password')
      .leftJoinAndSelect('user.programAssignments', 'assignment')
      .leftJoinAndSelect('assignment.program', 'program')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where(findOneOptions)
      .getOne();

    return userEntity;
  }

  public async getUsers() {
    return await this.userRepository.find({
      select: {
        id: true,
        username: true,
        admin: true,
        active: true,
        lastLogin: true,
        displayName: true,
        isOrganizationAdmin: true,
      },
      where: {
        userType: Equal(UserType.aidWorker),
      },
    });
  }

  public async getUsersInProgram(
    programId: number,
  ): Promise<GetUserReponseDto[]> {
    const users = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .leftJoinAndSelect('assignment.user', 'user')
      .where('assignment.programId = :programId', { programId })
      .andWhere('user.userType = :userType', { userType: UserType.aidWorker })
      .select([
        'user.id AS id',
        'user.username AS username',
        'user.admin AS admin',
        'user.active AS active',
        'user.lastLogin AS "lastLogin"',
        'ARRAY_AGG(roles.id) AS rolesId',
        'ARRAY_AGG(roles.role) AS role',
        'ARRAY_AGG(roles.label) AS label',
        'MAX(assignment.scope) AS scope',
      ])
      .groupBy('user.id')
      .getRawMany();

    const result = users.map((user) => {
      const roles = user.rolesid.map((id, index) => ({
        id,
        role: user.role[index],
        label: user.label[index],
      }));

      return {
        id: user.id,
        username: user.username,
        admin: user.admin,
        active: user.active,
        lastLogin: user.lastLogin,
        roles,
        scope: user.scope,
      };
    });

    return result;
  }

  public async findUsersByName(
    username: string,
  ): Promise<FindUserReponseDto[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :username', { username: `%${username}%` })
      .andWhere('user.userType = :userType', { userType: UserType.aidWorker })
      .leftJoin('user.programAssignments', 'assignment')
      .select([
        'user.id AS id',
        'user.username AS username',
        'ARRAY_AGG(assignment.programId) AS "assignedProgramIds"',
      ])
      .groupBy('user.id, user.username')
      .getRawMany();
  }

  public async getAidworkerProgramAssignment(
    programId: number,
    userId: number,
  ): Promise<AssignmentResponseDTO> {
    const assignment = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .where('assignment.programId = :programId', { programId })
      .andWhere('assignment.userId = :userId', { userId })
      .getOne();

    if (!assignment) {
      const errors = `User assignment for user id ${userId} to program ${programId} not found`;
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return {
      programId,
      userId,
      scope: assignment.scope,
      roles: assignment.roles.map((role) => this.getUserRoleResponse(role)),
    };
  }

  public async updateAidworkerProgramAssignment(
    programId: number,
    userId: number,
    assignAidworkerToProgram: UpdateProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id: Equal(userId) },
      relations: [
        'programAssignments',
        'programAssignments.program',
        'programAssignments.roles',
      ],
    });
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOneBy({
      id: programId,
    });
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const rolesToAdd = assignAidworkerToProgram.rolesToAdd || [];
    const newRoles = await this.userRoleRepository.find({
      where: {
        role: In(rolesToAdd),
      },
    });
    if (newRoles.length !== rolesToAdd.length) {
      const errors = { Roles: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // if already assigned: add roles to program assignment
    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === programId) {
        if (assignAidworkerToProgram.scope) {
          await this.checkNoApproverOrThrow({
            programAssignmentId: programAssignment.id,
          });
        }

        // Get the existing roles
        const existingRoles = programAssignment.roles;

        // Filter out roles that are already assigned
        const rolesToAdd = newRoles.filter(
          (newRole) =>
            !existingRoles.some(
              (existingRole) => existingRole.id === newRole.id,
            ),
        );

        // If there are roles to add, update the roles in the programAssignment
        programAssignment.roles = existingRoles.concat(rolesToAdd);
        programAssignment.scope = assignAidworkerToProgram.scope
          ? assignAidworkerToProgram.scope.toLowerCase()
          : '';

        // Save the updated programAssignment
        await this.assignmentRepository.save(programAssignment);

        return {
          programId,
          userId,
          scope: programAssignment.scope,
          roles: programAssignment.roles.map((role) =>
            this.getUserRoleResponse(role),
          ),
        };
      }
    }
    const errors = `User assignment for user id ${userId} to program ${programId} not found`;
    throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
  }

  public async getUserScopeForProgram(
    userId: number,
    programId: number,
  ): Promise<string> {
    const user = await this.findById(userId);
    const assignment = user.programAssignments.find(
      (a) => a.programId === programId,
    );
    if (!assignment) {
      throw new HttpException(
        'User assignment not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return assignment.scope;
  }

  public getScopeForUser(user: UserEntity, programId: number): string {
    programId = Number(programId);
    const assignment = user.programAssignments.find(
      (programAssignment) => programAssignment.programId === programId,
    );
    const scope = assignment?.scope ? assignment.scope : '';
    return scope;
  }

  public async changePasswordWithoutCurrentPassword(
    changePasswordDto: changePasswordWithoutCurrentPasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { username: Equal(changePasswordDto.username) },
    });
    if (!user || !user.username) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    user.salt = this.generateSalt();
    const password = this.generateStrongPassword();
    user.password = this.hashPassword(password, user.salt);
    await this.userRepository.save(user);

    const userEmailInput: UserEmailInput = {
      email: user.username,
      displayName: user.displayName ?? DEFAULT_DISPLAY_NAME,
      password,
    };

    await this.userEmailsService.send({
      userEmailInput,
      userEmailType: UserEmailType.passwordReset,
    });
  }

  private generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1, 32, 'sha256').toString('hex');
  }

  private generateStrongPassword(): string {
    if (IS_DEVELOPMENT && env.USERCONFIG_121_SERVICE_PASSWORD_TESTING) {
      return env.USERCONFIG_121_SERVICE_PASSWORD_TESTING;
    }
    return crypto.randomBytes(30).toString('base64').slice(0, 25);
  }
}
