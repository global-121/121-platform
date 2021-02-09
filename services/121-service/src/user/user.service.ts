import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';
import crypto from 'crypto';
import jwt = require('jsonwebtoken');

import { ProgramEntity } from '../programs/program/program.entity';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { UserRole } from '../user-role.enum';
import { UserRoleEntity } from './user-role.entity';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(UserRoleEntity)
  private readonly userRoleRepository: Repository<UserRoleEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() {}

  public async findOne(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const findOneOptions = {
      email: loginUserDto.email,
      password: crypto
        .createHmac('sha256', loginUserDto.password)
        .digest('hex'),
    };
    const user = await getRepository(UserEntity)
      .createQueryBuilder('user')
      .addSelect('password')
      .leftJoinAndSelect('user.roles', 'roles')
      .where(findOneOptions)
      .getOne();
    return user;
  }

  public async create(dto: CreateUserDto): Promise<UserRO> {
    // check uniqueness of email
    const { email, password, roles } = dto;
    const qb = await getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    const user = await qb.getOne();

    if (user) {
      const errors = { email: 'Email must be unique.' };
      throw new HttpException(
        { message: 'Input data validation failed', errors },
        HttpStatus.BAD_REQUEST,
      );
    }

    // create new user
    let newUser = new UserEntity();
    newUser.email = email;
    newUser.password = password;
    newUser.roles = (await this.userRoleRepository.find()).filter(role =>
      roles.includes(role.role),
    );

    newUser.programs = [];
    newUser.assignedProgram = [];

    const savedUser = await this.userRepository.save(newUser);
    return this.buildUserRO(savedUser);
  }

  public async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    let toUpdate = await this.userRepository.findOne(id, {
      relations: ['assignedProgram'],
    });
    let updated = toUpdate;
    updated.password = crypto.createHmac('sha256', dto.password).digest('hex');
    const updatedUser = await this.userRepository.save(updated);
    return this.buildUserRO(updatedUser);
  }

  public async assignProgram(userId: number, programId: number): Promise<any> {
    let user = await this.userRepository.findOne(userId, {
      relations: ['assignedProgram'],
    });
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    const program = await this.programRepository.findOne(programId);
    if (!program) {
      const errors = { Program: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    if (!user.assignedProgram) {
      console.log('No program assigned');
      user.assignedProgram = [];
    }
    user.assignedProgram.push(program);
    const updatedUser = await this.userRepository.save(user);
    return this.buildUserRO(updatedUser);
  }

  public async delete(
    deleterId: number,
    userId: number,
  ): Promise<DeleteResult> {
    const deleter = await this.userRepository.findOne(deleterId, {
      relations: ['roles'],
    });
    const user = await this.userRepository.findOne(userId, {
      relations: ['roles'],
    });

    // If not project-officer (= admin, as other roles have no access to this endpoint), can delete any user
    if (
      !deleter.roles.includes(
        await this.userRoleRepository.findOne({
          where: { role: UserRole.RunProgram },
        }),
      )
    ) {
      return await this.userRepository.delete(userId);
    }

    // project-officer can only delete aidworkers
    if (
      user.roles.includes(
        await this.userRoleRepository.findOne({
          where: { role: UserRole.FieldValidation },
        }),
      )
    ) {
      return await this.userRepository.delete(userId);
    } else {
      const errors = { Delete: 'project-officer can only delete aidworkers' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
  }

  public async findById(id: number): Promise<UserRO> {
    const user = await this.userRepository.findOne(id, {
      relations: ['roles'],
    });

    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }

    return this.buildUserRO(user);
  }

  public async findByEmail(email: string): Promise<UserRO> {
    const user = await this.userRepository.findOne({ email: email });
    return this.buildUserRO(user);
  }

  public generateJWT(user: UserEntity): string {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    const result = jwt.sign(
      {
        email: user.email,
        roles: user.roles.map(role => role.role),
        exp: exp.getTime() / 1000,
      },
      process.env.SECRETS_121_SERVICE_SECRET,
    );

    return result;
  }

  private buildUserRO(user: UserEntity): UserRO {
    const userRO = {
      id: user.id,
      email: user.email,
      token: this.generateJWT(user),
      roles: user.roles,
      assignedProgramId: user.assignedProgram,
    };
    return { user: userRO };
  }
}
