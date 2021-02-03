import { UserEntity } from './user.entity';
import { Test } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRO } from './user.interface';
import { DeleteResult } from 'typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import { UserRoleEntity } from './user-role.entity';

const userRo = {
  user: {
    email: 'test@example.org',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
    roles: [new UserRoleEntity()],
  },
};

class UserServiceMock {
  public async findByEmail(): Promise<UserRO> {
    return userRo;
  }
  public async create(userData: CreateUserDto): Promise<UserRO> {
    const userRole = new UserRoleEntity();
    userRole.role = userData.roles[0];
    const userRo = {
      user: {
        email: userData.email,
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
        roles: [userRole],
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
    user.email = 'test@example.org';
    user.password =
      'c90f86e09c3461da52b3d8bc80ccd6a0d0cb893b1a41bd461e8ed31fa21c9b6e';
    user.roles = [new UserRoleEntity()];
    return user;
  }
  public generateJWT(user): any {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo';
  }
}

describe('UserController', (): void => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(
    async (): Promise<void> => {
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
    },
  );

  describe('findMe', (): void => {
    it('should return a user', async (): Promise<void> => {
      const spy = jest
        .spyOn(userService, 'findByEmail')
        .mockImplementation((): Promise<UserRO> => Promise.resolve(userRo));
      const controllerResult = await userController.findMe('test@example.org');

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(userRo);
    });
  });

  describe('login', (): void => {
    it('should return a user', async (): Promise<void> => {
      const loginParameters = {
        email: 'test@example.org',
        password: 'string',
      };
      const controllerResult = await userController.login(loginParameters);

      expect(controllerResult).toStrictEqual(userRo);

      const spy = jest
        .spyOn(userService, 'findOne')
        .mockImplementation(
          (): Promise<UserEntity> => Promise.resolve(new UserEntity()),
        );
      await userController.login(loginParameters);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('create', (): void => {
    it('should return an a user entity', async (): Promise<void> => {
      const userValue = {
        email: 'test@example.org',
        password: 'string',
        roles: [new UserRoleEntity()],
      };
      const spy = jest
        .spyOn(userService, 'create')
        .mockImplementation((): Promise<UserRO> => Promise.resolve(userRo));
      const controllerResult = await userController.create(userValue);

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toEqual(userRo);
    });
  });

  describe('delete', (): void => {
    it('should return an array of users', async (): Promise<void> => {
      const spy = jest
        .spyOn(userService, 'delete')
        .mockImplementation(
          (): Promise<DeleteResult> => Promise.resolve(new DeleteResult()),
        );
      const controllerResult = await userController.delete(1, 1);

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(new DeleteResult());
    });
  });
});
