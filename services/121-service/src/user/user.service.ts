import { HttpStatus, Inject, Injectable, Scope } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { DataSource, In, Repository } from 'typeorm';
import { DEBUG } from '../config';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';
import { ProgramEntity } from '../programs/program.entity';
import { CookieNames } from './../shared/enum/cookie.enums';
import { InterfaceNames } from './../shared/enum/interface-names.enum';
import { LoginUserDto, UpdateUserDto } from './dto';
import { AssignAidworkerToProgramDto } from './dto/assign-aw-to-program.dto';
import { CookieSettingsDto } from './dto/cookie-settings.dto';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateUserRoleDto, UpdateUserRoleDto } from './dto/user-role.dto';
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

  public constructor(
    @Inject(REQUEST) private readonly request: Request,
    private readonly dataSource: DataSource,
  ) {}

  public async login(loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    const saltCheck = await this.dataSource
      .getRepository(UserEntity)
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
    const userEntity = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .addSelect('password')
      .leftJoinAndSelect('user.programAssignments', 'assignment')
      .leftJoinAndSelect('assignment.program', 'program')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where(findOneOptions)
      .getOne();
    if (!userEntity) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const username = userEntity.username;
    const permissions = await this.buildPermissionsObject(userEntity.id);
    const token = this.generateJWT(userEntity);
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

  public async getUserRoles(): Promise<UserRoleEntity[]> {
    return await this.userRoleRepository.find({
      relations: ['permissions'],
    });
  }
  
  public async getUsers(): Promise<UserEntity[]> {
    return await this.userRepository.find();
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
        await this.permissionRepository.findOneBy({ name: permission }),
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
        await this.permissionRepository.findOneBy({ name: permission }),
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
    const qb = this.dataSource
      .getRepository(UserEntity)
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

  public async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    const toUpdate = await this.userRepository.findOne({
      where: { id: id },
      relations: [
        'programAssignments',
        'programAssignments.roles',
        'programAssignments.roles.permissions',
      ],
    });
    const updated = toUpdate;
    updated.salt = crypto.randomBytes(16).toString('hex');
    updated.password = crypto
      .pbkdf2Sync(dto.password, updated.salt, 1, 32, 'sha256')
      .toString('hex');
    await this.userRepository.save(updated);
    return await this.buildUserRO(updated);
  }

  public async assigAidworkerToProgram(
    programId: number,
    userId: number,
    assignAidworkerToProgram: AssignAidworkerToProgramDto,
  ): Promise<UserRoleEntity[]> {
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

    // if already assigned: add roles to program assignment
    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === programId) {
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

  public async deleteAssignment(
    programId: number,
    userId: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['programAssignments', 'programAssignments.program'],
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

    // If 0 roles are posted remove aidworker assignment
    for (const programAssignment of user.programAssignments) {
      if (programAssignment.program.id === programId) {
        this.assignmentRepository.remove(programAssignment);
        // Also remove user without assignments
        if (user.programAssignments.length <= 1) {
          this.userRepository.remove(user);
        }
        return;
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

    return await this.userRepository.remove(user);
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
    let permissions = [];

    const permissionsObject = {};
    if (user.programAssignments && user.programAssignments[0]) {
      for (const programAssignment of user.programAssignments) {
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
}
