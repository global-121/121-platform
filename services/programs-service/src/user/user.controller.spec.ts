import { UserEntity } from './user.entity';
import { Test } from '@nestjs/testing';
import 'jest';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRO } from './user.interface';
import { DeleteResult } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';

const userRo = {
  user: {
    username: 'string',
    email: 'test@test.nl',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
    role: 'aidworker',
    countryId: 1,
  },
};

class UserServiceMock {
  public async findByEmail(): Promise<UserRO> {
    return userRo;
  }
  public async create(userData: CreateUserDto): Promise<UserRO> {
    const userRo = {
      user: {
        username: userData.username,
        email: userData.email,
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
        role: userData.role,
        countryId: userData.countryId,
      },
    };
    return userRo;
  }
  public async delete(userId: number): Promise<DeleteResult> {
    return new DeleteResult();
  }
  public async findOne(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = new UserEntity();
    user.id = 1;
    user.username = 'string';
    user.email = 'test@test.nl';
    user.password =
      'c90f86e09c3461da52b3d8bc80ccd6a0d0cb893b1a41bd461e8ed31fa21c9b6e';
    user.role = 'aidworker';
    user.countryId = 1;
    return user;
  }
  public generateJWT(user) {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo';
  }
}

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: new UserServiceMock(),
        },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
  });

  describe('findMe', () => {
    it('should return a user', async () => {
      const spy = jest
        .spyOn(userService, 'findByEmail')
        .mockImplementation(() => Promise.resolve(userRo));
      const controllerResult = await userController.findMe('test@test.nl');

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(userRo);
    });
  });

  describe('login', () => {
    it('should return a user', async () => {
      const loginParameters = {
        email: 'test@test.nl',
        password: 'string',
      };
      const controllerResult = await userController.login(loginParameters);

      expect(controllerResult).toStrictEqual(userRo);

      const spy = jest
        .spyOn(userService, 'findOne')
        .mockImplementation(() => Promise.resolve(new UserEntity()));
      await userController.login(loginParameters);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should return an a user entity', async () => {
      const userValue = {
        username: 'string',
        email: 'test@test.nl',
        password: 'string',
        role: 'aidworker',
        countryId: 1,
      };
      const spy = jest
        .spyOn(userService, 'create')
        .mockImplementation(() => Promise.resolve(userRo));
      const controllerResult = await userController.create(userValue);

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toEqual(userRo);
    });
  });

  describe('delete', () => {
    it('should return an array of users', async () => {
      const spy = jest
        .spyOn(userService, 'delete')
        .mockImplementation(() => Promise.resolve(new DeleteResult()));
      const controllerResult = await userController.delete(1);

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(new DeleteResult());
    });
  });
});
