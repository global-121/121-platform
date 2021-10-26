import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { PersonAffectedAppDataEntity } from './../people-affected/person-affected-app-data.entity';
import { CreateUserAidWorkerDto } from './dto/create-user-aid-worker.dto';
import { CreateUserPersonAffectedDto } from './dto/create-user-person-affected.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult, RemoveEvent } from 'typeorm';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';
import crypto from 'crypto';
import jwt = require('jsonwebtoken');

import { ProgramEntity } from '../programs/program.entity';
import { LoginUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { UserRole } from '../user-role.enum';
import { UserRoleEntity } from './user-role.entity';
import { UserType } from './user-type-enum';
import { ProgramAidworkerAssignmentEntity } from '../programs/program-aidworker.entity';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(RegistrationEntity)
  private readonly registrationRepository: Repository<RegistrationEntity>;
  @InjectRepository(UserRoleEntity)
  private readonly userRoleRepository: Repository<UserRoleEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;
  @InjectRepository(ProgramAidworkerAssignmentEntity)
  private readonly assignmentRepository: Repository<
    ProgramAidworkerAssignmentEntity
  >;
  @InjectRepository(PersonAffectedAppDataEntity)
  private readonly personAffectedAppDataRepo: Repository<
    PersonAffectedAppDataEntity
  >;
  @InjectRepository(TransactionEntity)
  private readonly transactionRepository: Repository<TransactionEntity>;

  public constructor() {}

  public async findOne(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const findOneOptions = {
      username: loginUserDto.username,
      password: crypto
        .createHmac('sha256', loginUserDto.password)
        .digest('hex'),
    };
    const user = await getRepository(UserEntity)
      .createQueryBuilder('user')
      .addSelect('password')
      .leftJoinAndSelect('user.programAssignments', 'assignment')
      .leftJoinAndSelect('assignment.roles', 'roles')
      .where(findOneOptions)
      .getOne();
    return user;
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
      relations: ['programAssignments', 'programAssignments.roles'],
    });
    let updated = toUpdate;
    updated.password = crypto.createHmac('sha256', dto.password).digest('hex');
    await this.userRepository.save(updated);
    return this.buildUserRO(updated);
  }

  public async assignFieldValidationAidworkerToProgram(
    userId: number,
    programId: number,
  ): Promise<void> {
    let user = await this.userRepository.findOne(userId);
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!user.programAssignments) {
      console.log('No program assigned');
    }
    await this.assignmentRepository.save({
      user: { id: userId },
      program: { id: programId },
      roles: await this.userRoleRepository.find({
        where: {
          role: UserRole.FieldValidation,
        },
      }),
    });
  }

  public async delete(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId, {
      relations: ['programAssignments', 'programAssignments.roles'],
    });

    await this.assignmentRepository.remove(user.programAssignments);

    return await this.userRepository.remove(user);
  }

  public async deletePersonAffected(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne(userId);
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
      relations: ['programAssignments', 'programAssignments.roles'],
    });
    return this.buildUserRO(user);
  }

  public generateJWT(user: UserEntity): string {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    let roles = [];
    if (user.programAssignments && user.programAssignments[0]) {
      roles = user.programAssignments[0].roles.map(role => role.role);
    }

    const result = jwt.sign(
      {
        id: user.id,
        username: user.username,
        roles,
        exp: exp.getTime() / 1000,
      },
      process.env.SECRETS_121_SERVICE_SECRET,
    );

    return result;
  }

  private buildUserRO(user: UserEntity): UserRO {
    let roles = [];
    if (user.programAssignments && user.programAssignments[0]) {
      roles = user.programAssignments[0].roles;
    }

    const userRO = {
      id: user.id,
      username: user.username,
      token: this.generateJWT(user),
      roles,
    };
    return { user: userRO };
  }
}
