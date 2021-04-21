import { ReferenceIdDto } from './dto/reference-id.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { UserEntity } from './user.entity';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { UserRO } from './user.interface';
import { validate } from 'class-validator';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { HttpStatus } from '@nestjs/common';
import crypto from 'crypto';

import jwt = require('jsonwebtoken');
import { DeleteUserDto } from './dto/delete-user.dts';
import { DataStorageEntity } from '../data-storage/data-storage.entity';
import { DataStorageService } from '../data-storage/data-storage.service';

@Injectable()
export class UserService {
  @InjectRepository(UserEntity)
  private readonly userRepository: Repository<UserEntity>;
  @InjectRepository(DataStorageEntity)
  private readonly dataStorageRepository: Repository<DataStorageEntity>;

  public constructor(private dataStorageService: DataStorageService) {}

  public async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
  }

  public async findOne(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const findOneOptions = {
      username: loginUserDto.username,
      password: crypto
        .createHmac('sha256', loginUserDto.password)
        .digest('hex'),
    };

    return await this.userRepository.findOne(findOneOptions);
  }

  public async create(dto: CreateUserDto): Promise<UserRO> {
    // check uniqueness of username
    const { username, password } = dto;
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

    const errors = await validate(newUser);
    if (errors.length > 0) {
      const _errors = { username: 'User input is not valid.' };
      throw new HttpException(
        { message: 'Input data validation failed', _errors },
        HttpStatus.BAD_REQUEST,
      );
    } else {
      const savedUser = await this.userRepository.save(newUser);
      return this.buildUserRO(savedUser);
    }
  }

  public async setReferenceId(
    id: number,
    referenceIdDto: ReferenceIdDto,
  ): Promise<void> {
    let user = await this.userRepository.findOne(id);
    user.referenceId = referenceIdDto.referenceId;
    await this.userRepository.save(user);
  }

  public async update(id: number, dto: UpdateUserDto): Promise<UserRO> {
    let toUpdate = await this.userRepository.findOne(id);
    let updated = toUpdate;
    updated.password = crypto.createHmac('sha256', dto.password).digest('hex');
    const updatedUser = await this.userRepository.save(updated);
    return this.buildUserRO(updatedUser);
  }

  public async deleteAccount(
    id: number,
    passwordData: DeleteUserDto,
  ): Promise<void> {
    const findOneOptions = {
      id: id,
    };
    const user = await this.userRepository.findOne(findOneOptions);

    if (!user) {
      const errors = 'User not found or already deleted';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const hashedpassword = crypto
      .createHmac('sha256', passwordData.password)
      .digest('hex');
    if (user.password !== hashedpassword) {
      const errors = 'Password for user is incorrect';
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }
    await this.dataStorageRepository.delete({
      userId: user.id,
    });
    await this.userRepository.delete(user.id);
  }

  public async getWalletAndDeleteAccount(referenceId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { referenceId: referenceId },
    });
    if (!user) {
      const errors = 'User not found or already deleted';
      throw new HttpException({ errors }, HttpStatus.BAD_REQUEST);
    }

    const wallet = await this.dataStorageService.get(user.id, 'wallet');

    await this.dataStorageRepository.delete({
      userId: user.id,
    });
    await this.userRepository.delete(user.id);

    return wallet;
  }

  public async findById(id: number): Promise<UserRO> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      const errors = { User: ' not found' };
      throw new HttpException({ errors }, HttpStatus.UNAUTHORIZED);
    }

    return this.buildUserRO(user);
  }

  public async findByUsername(username: string): Promise<UserRO> {
    const user = await this.userRepository.findOne({ username: username });
    if (!user) {
      const errors = { username: username + ' not found' };
      console.log(errors);
      throw new HttpException({ errors }, HttpStatus.NOT_FOUND);
    }
    return this.buildUserRO(user);
  }

  public generateJWT(user: UserEntity): string {
    let today = new Date();
    let exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    const result = jwt.sign(
      {
        id: user.id,
        username: user.username,
        exp: exp.getTime() / 1000,
      },
      process.env.SECRETS_PA_ACCOUNTS_SERVICE_SECRET,
    );

    return result;
  }

  private buildUserRO(user: UserEntity): UserRO {
    const userRO = {
      id: user.id,
      username: user.username,
      token: this.generateJWT(user),
    };

    return { user: userRO };
  }
}
