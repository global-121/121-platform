import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, DeleteResult } from 'typeorm';
import { SECRET } from '../secrets';
import { validate } from 'class-validator';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';
import crypto from 'crypto';
import jwt = require('jsonwebtoken');

import { ProgramEntity } from '../programs/program/program.entity';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './user.entity';
import { UserRO } from './user.interface';
import { UserRole } from '../user-role.enum';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor() { }

  public async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  public async findOne(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const findOneOptions = {
      email: loginUserDto.email,
      password: crypto
        .createHmac('sha256', loginUserDto.password)
        .digest('hex'),
    };
    const user = await getRepository(UserEntity)
      .createQueryBuilder()
      .addSelect('password')
      .where(findOneOptions)
      .getOne();
    return user;
  }

  public async create(dto: CreateUserDto): Promise<UserRO> {
    // check uniqueness of email
    const { email, password, role, countryId } = dto;
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
    newUser.role = role;
    newUser.countryId = countryId;

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

  public async deactivate(id: number): Promise<UserRO> {
    let updated = await this.userRepository.findOne(id, {
      relations: ['assignedProgram'],
    });
    if (updated.role == 'admin') {
      const _errors = { email: 'Cannot change status of admin-user.' };
      throw new HttpException(
        { message: 'Input data validation failed', _errors },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      updated.status = 'inactive';
      const updatedUser = await this.userRepository.save(updated);
      return this.buildUserRO(updatedUser);
    }
  }

  public async activate(id: number): Promise<UserRO> {
    let updated = await this.userRepository.findOne(id, {
      relations: ['assignedProgram'],
    });
    if (updated.role == 'admin') {
      const _errors = { email: 'Cannot change status of admin-user.' };
      throw new HttpException(
        { message: 'Input data validation failed', _errors },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      updated.status = 'active';
      const updatedUser = await this.userRepository.save(updated);
      return this.buildUserRO(updatedUser);
    }
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

  public async delete(deleterId: number, userId: number): Promise<DeleteResult> {
    const deleter = await this.userRepository.findOne(deleterId);
    const user = await this.userRepository.findOne(userId);

    // If not program-manager (= admin, as other roles have no access to this endpoint), can delete any user
    if (deleter.role !== UserRole.ProgramManager) {
      return await this.userRepository.delete(userId);
    }

    // Program-manager can only delete aidworkers
    if (user.role === UserRole.Aidworker) {
      return await this.userRepository.delete(userId);
    } else {
      const errors = { Delete: 'Program manager can only delete aidworkers' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
  }

  public async findById(id: number): Promise<UserRO> {
    const user = await this.userRepository.findOne(id);

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
        id: user.id,
        email: user.email,
        role: user.role,
        exp: exp.getTime() / 1000,
      },
      SECRET,
    );

    return result;
  }

  private buildUserRO(user: UserEntity): UserRO {
    const userRO = {
      id: user.id,
      email: user.email,
      token: this.generateJWT(user),
      role: user.role,
      status: user.status,
      countryId: user.countryId,
      assignedProgramId: user.assignedProgram,
    };
    return { user: userRO };
  }
}
