import { HttpStatus, Inject, Injectable, Scope } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { In, Repository } from 'typeorm';
import { DEBUG } from '../config';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { ProgramEntity } from '../programs/program.entity';
import { CookieNames } from './../shared/enum/cookie.enums';
import { InterfaceNames } from './../shared/enum/interface-names.enum';
import { LoginUserDto, UpdateUserDto } from './dto';
import {
  CreateProgramAssignmentDto,
  DeleteProgramAssignmentDto,
  UpdateProgramAssignmentDto,
} from './dto/assign-aw-to-program.dto';
import { CookieSettingsDto } from './dto/cookie-settings.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { FindUserReponseDto } from './dto/find-user-response.dto';
import { GetUserReponseDto } from './dto/get-user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
import {
  AssignmentResponseDTO,
  UserRoleResponseDTO,
} from './dto/userrole-response.dto';
import { PermissionEnum } from './enum/permission.enum';
import { PermissionEntity } from './permissions.entity';
import { UserRoleEntity } from './user-role.entity';
import { UserType } from './user-type-enum';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
export const tokenExpirationDays = 14;

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

  public constructor(@Inject(REQUEST) private readonly request: Request) {}

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const userEntity = await this.matchPassword(loginUserDto);

    if (!userEntity) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const username = userEntity.username;
    const permissions = await this.buildPermissionsObject(userEntity.id);
    const token = this.generateJWT(userEntity);
    const user: UserRO = {
      user: {
        id: userEntity.id,
        username,
        token,
        permissions,
        isAdmin: userEntity.admin,
      },
    };

    const cookieSettings = this.buildCookieByRequest(token);
    userEntity.lastLogin = new Date();
    await this.userRepository.save(userEntity);
    return { userRo: user, cookieSettings: cookieSettings, token: token };
  }

  public async canActivate(permissions, programId, userId): Promise<boolean> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.programAssignments', 'assignment')
      .leftJoin('assignment.program', 'program')
      .leftJoin('assignment.roles', 'roles')
      .leftJoin('roles.permissions', 'permissions')
      .where('user.id = :userId', { userId: userId })
      .andWhere('program.id = :programId', { programId: programId })
      .andWhere('permissions.name IN (:...permissions)', {
        permissions: permissions,
      })
      .getCount();
    return results === 1;
  }

  public async createPersonAffected(
    dto: CreateUserPersonAffectedDto,
  ): Promise<UserRO> {
    return await this.create(
      dto.username,
      dto.password,
      UserType.personAffected,
    );
  }

  public async getUserRoles(userId: number): Promise<UserRoleResponseDTO[]> {
    // TODO: REFACTOR: this checks if the user has this permission for at least 1 program, which is unideal
    await this.getProgramScopeIdsUserHasPermission(
      userId,
      PermissionEnum.AidWorkerProgramREAD,
    );
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
      where: { id: userId },
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
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  private getUserRoleResponse(userRole: UserRoleEntity): UserRoleResponseDTO {
    const userRoleResponse: UserRoleResponseDTO = {
      id: userRole.id,
      role: userRole.role,
      label: userRole.label,
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
      where: { role: userRoleData.role },
    });
    if (existingRole) {
      throw new HttpException('Role exists already', HttpStatus.BAD_REQUEST);
    }

    const userRoleEntity = new UserRoleEntity();
    userRoleEntity.role = userRoleData.role;
    userRoleEntity.label = userRoleData.label;
    const permissionEntities = [];
    for (const permission of userRoleData.permissions) {
      permissionEntities.push(
        await this.permissionRepository.findOneBy({ name: permission }),
      );
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
    existingRole.label = userRoleData.label;
    const permissionEntities = [];
    for (const permission of userRoleData.permissions) {
      permissionEntities.push(
        await this.permissionRepository.findOneBy({ name: permission }),
      );
    }
    existingRole.permissions = permissionEntities;

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

  public async createAidWorker(dto: CreateUserAidWorkerDto): Promise<UserRO> {
    return await this.create(dto.email, dto.password, UserType.aidWorker);
  }

  public async create(
    username: string,
    password: string,
    userType: UserType,
  ): Promise<UserRO> {
    // check uniqueness of email
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username });

    const user = await qb.getOne();

    if (user) {
      const errors = { username: 'Username must be unique.' };
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
    const savedUser = await this.userRepository.save(newUser);
    return await this.buildUserRO(savedUser);
  }

  public async update(dto: UpdateUserDto): Promise<UserRO> {
    const userEntity = await this.matchPassword(dto);

    if (!userEntity) {
      throw new HttpException(
        'Your password was incorrect.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const updated = userEntity;
    updated.salt = crypto.randomBytes(16).toString('hex');
    updated.password = crypto
      .pbkdf2Sync(dto.newPassword, updated.salt, 1, 32, 'sha256')
      .toString('hex');
    await this.userRepository.save(updated);
    return await this.buildUserRO(updated);
  }

  public async assignAidworkerToProgram(
    programId: number,
    userId: number,
    assignAidworkerToProgram: CreateProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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
        programAssignment.roles = newRoles;
        programAssignment.scope = scope;
        await this.assignmentRepository.save(programAssignment);
        response.roles = programAssignment.roles.map((role) =>
          this.getUserRoleResponse(role),
        );
        return response;
      }
    }

    // if not assigned to program: create new asignment
    await this.assignmentRepository.save({
      user: { id: user.id },
      program: { id: program.id },
      roles: newRoles,
      scope: scope,
    });
    response.roles = newRoles.map((role) => this.getUserRoleResponse(role));
    return response;
  }

  public async deleteAidworkerRolesOrAssignment(
    programId: number,
    userId: number,
    assignAidworkerToProgram: DeleteProgramAssignmentDto,
  ): Promise<AssignmentResponseDTO | void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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
      where: { role: In(assignAidworkerToProgram.rolesToDelete || []) },
    });
    if (
      assignAidworkerToProgram.rolesToDelete &&
      rolesToDelete.length !== assignAidworkerToProgram.rolesToDelete.length
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['programAssignments', 'programAssignments.roles'],
    });

    await this.assignmentRepository.remove(user.programAssignments);

    try {
      return await this.userRepository.remove(user);
    } catch (e) {
      if (e.code === '23503') {
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
      where: { id: id },
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

  public async findByUsername(username: string): Promise<UserRO> {
    const user = await this.userRepository.findOne({
      where: { username: username },
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
    return await this.buildUserRO(user);
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
      },
      process.env.SECRETS_121_SERVICE_SECRET,
    );

    return result;
  }

  public getInterfaceKeyByHeader(): string {
    const headerKey = 'x-121-interface';
    const originInterface = this.request.headers[headerKey];
    switch (originInterface) {
      case InterfaceNames.portal:
        return CookieNames.portal;
      case InterfaceNames.awApp:
        return CookieNames.awApp;
      case InterfaceNames.paApp:
        return CookieNames.paApp;
      default:
        return CookieNames.general;
    }
  }

  private async buildUserRO(user: UserEntity): Promise<UserRO> {
    const permissions = await this.buildPermissionsObject(user.id);

    const userRO = {
      id: user.id,
      token: this.generateJWT(user),
      username: user.username,
      permissions,
    };
    return { user: userRO };
  }

  private async buildPermissionsObject(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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
        let permissions = [];
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
    let domain: string;
    let path: string;
    const tokenKey: string = this.getInterfaceKeyByHeader();

    return {
      tokenKey,
      tokenValue: token,
      domain,
      path,
      sameSite: DEBUG ? 'Lax' : 'None',
      secure: !DEBUG,
      expires: new Date(Date.now() + tokenExpirationDays * 24 * 3600000),
      httpOnly: true,
    };
  }

  public async matchPassword(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const saltCheck = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.salt')
      .where({ username: loginUserDto.username })
      .getOne();

    if (!saltCheck) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const userSalt = saltCheck.salt;

    const findOneOptions = {
      username: loginUserDto.username,
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

  public async getUsers(): Promise<UserEntity[]> {
    return await this.userRepository.find({
      select: {
        id: true,
        username: true,
        admin: true,
        active: true,
        lastLogin: true,
      },
      where: {
        userType: UserType.aidWorker,
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
      where: { id: userId },
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
    return assignment.scope;
  }
}
