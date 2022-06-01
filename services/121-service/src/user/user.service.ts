import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, In } from 'typeorm';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';
import crypto from 'crypto';
import jwt = require('jsonwebtoken');
import { ProgramEntity } from '../programs/program.entity';
import { LoginUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { UserRoleEntity } from './user-role.entity';
import { UserType } from './user-type-enum';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
import { PermissionEntity } from './permissions.entity';
import { CookieSettingsDto } from './dto/cookie-settings.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InterfaceNames } from './../shared/enum/interface-names.enum';
import { CookieNames } from './../shared/enum/cookie.enums';

export const tokenExpirationTime = 14 * 24 * 3600000;

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
  private readonly assignmentRepository: Repository<
    ProgramAidworkerAssignmentEntity
  >;


  public constructor(@Inject(REQUEST) private readonly request: Request) {}

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const findOneOptions = {
      username: loginUserDto.username,
      password: crypto
        .createHmac('sha256', loginUserDto.password)
        .digest('hex'),
    };
    const userEntity = await getRepository(UserEntity)
      .createQueryBuilder('user')
      .addSelect('password')
      .leftJoinAndSelect('user.programAssignments', 'assignment')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where(findOneOptions)
      .getOne();
    if (!userEntity) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const username = userEntity.username;
    const token = this.generateJWT(userEntity);
    const permissions = this.buildPermissionArray(userEntity);
    const user: UserRO = {
      user: {
        username,
        token,
        permissions,
      },
    };

    const cookieSettings = this.buildCookieByRequest(token);
    return { userRo: user, cookieSettings: cookieSettings };
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

  public async getUserRoles(): Promise<UserRoleEntity[]> {
    return await this.userRoleRepository.find({ relations: ['permissions'] });
  }

  public async addUserRole(
    userRoleData: CreateUserRoleDto,
  ): Promise<UserRoleEntity> {
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
        await this.permissionRepository.findOne({ name: permission }),
      );
    }
    userRoleEntity.permissions = permissionEntities;

    return await this.userRoleRepository.save(userRoleEntity);
  }

  public async updateUserRole(
    userRoleId: number,
    userRoleData: UpdateUserRoleDto,
  ): Promise<UserRoleEntity> {
    const existingRole = await this.findRoleOrThrow(userRoleId);
    existingRole.label = userRoleData.label;
    const permissionEntities = [];
    for (const permission of userRoleData.permissions) {
      permissionEntities.push(
        await this.permissionRepository.findOne({ name: permission }),
      );
    }
    existingRole.permissions = permissionEntities;

    return await this.userRoleRepository.save(existingRole);
  }

  public async deleteUserRole(userRoleId: number): Promise<UserRoleEntity> {
    const existingRole = await this.findRoleOrThrow(userRoleId);
    return await this.userRoleRepository.remove(existingRole);
  }

  private async findRoleOrThrow(userRoleId: number): Promise<UserRoleEntity> {
    const existingRole = await this.userRoleRepository.findOne(userRoleId);
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
    const qb = await getRepository(UserEntity)
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
    let newUser = new UserEntity();
    newUser.username = username;
    newUser.password = password;
    newUser.userType = userType;
    const savedUser = await this.userRepository.save(newUser);
    return this.buildUserRO(savedUser);
  }

  public async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    let toUpdate = await this.userRepository.findOne(id, {
      relations: [
        'programAssignments',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
      ],
    });
    let updated = toUpdate;
    updated.password = crypto.createHmac('sha256', dto.password).digest('hex');
    await this.userRepository.save(updated);
    return this.buildUserRO(updated);
  }

  public async assigAidworkerToProgram(
    assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleEntity[]> {
    const user = await this.userRepository.findOne(
      assignAidworkerToProgram.userId,
      {
        relations: [
          'programAssignments',
          'programAssignments.program',
          'programAssignments.roles',
        ],
      },
    );
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOne(
      assignAidworkerToProgram.programId,
    );
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    const newRoles = await this.userRoleRepository.find({
      where: {
        role: In(assignAidworkerToProgram.roles),
      },
    });
    if (!newRoles.length) {
      const errors = { Roles: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    // if already assigned: add roles to program assignment
    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === assignAidworkerToProgram.programId) {
        programAssignment.roles = newRoles;
        await this.assignmentRepository.save(programAssignment);
        return programAssignment.roles;
      }
    }

    // if not assigned to program: create new asignment
    await this.assignmentRepository.save({
      user: { id: user.id },
      program: { id: program.id },
      roles: newRoles,
    });
    return newRoles;
  }

  public async delete(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['programAssignments', 'programAssignments.roles'],
    });

    await this.assignmentRepository.remove(user.programAssignments);

    return await this.userRepository.remove(user);
  }

  public async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne(id, {
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
    return this.buildUserRO(user);
  }

  public generateJWT(user: UserEntity): string {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    let roles = [];
    let permissions = [];
    if (user.programAssignments && user.programAssignments[0]) {
      roles = user.programAssignments[0].roles.map(role => role.role);
      for (const role of user.programAssignments[0].roles) {
        const permissionNames = role.permissions.map(a => a.name);
        permissions = [...new Set([...permissions, ...permissionNames])];
      }
    }

    const result = jwt.sign(
      {
        id: user.id,
        username: user.username,
        roles,
        exp: exp.getTime() / 1000,
        permissions,
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

  private buildUserRO(user: UserEntity): UserRO {
    let permissions = this.buildPermissionArray(user);

    const userRO = {
      id: user.id,
      username: user.username,
      token: this.generateJWT(user),
      permissions,
    };
    return { user: userRO };
  }

  private buildPermissionArray(user: UserEntity): string[] {
    let roles = [];
    let permissions = [];

    if (user.programAssignments && user.programAssignments[0]) {
      roles = user.programAssignments[0].roles.map(role => role.role);
      for (const role of user.programAssignments[0].roles) {
        const permissionNames = role.permissions.map(a => a.name);
        permissions = [...new Set([...permissions, ...permissionNames])];
      }
    }
    return permissions;
  }

  private buildCookieByRequest(token: string): CookieSettingsDto {
    let domain: string;
    let path: string;
    let tokenKey: string = this.getInterfaceKeyByHeader();

    return {
      tokenKey,
      tokenValue: token,
      domain,
      path,
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + tokenExpirationTime),
      httpOnly: true,
    };
  }
}
