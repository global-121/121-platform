import { UserEntity } from './user.entity';
import { Test } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRO } from './user.interface';
import { LoginUserDto } from './dto/login-user.dto';
import { RolesGuard } from '../roles.guard';

const userRo = {
  user: {
    username: 'test-pa',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
  },
};

class UserServiceMock {
  public async findByUsername(): Promise<UserRO> {
    return userRo;
  }
  public async create(userData: CreateUserDto): Promise<UserRO> {
    const userRo = {
      user: {
        username: userData.username,
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJzdHJpZG5nIiwiZW1haWwiOiJ0ZXNkZnN0QHRlc3QubmwiLCJleHAiOjE1NjYwMzE4MzEuMjk0LCJpYXQiOjE1NjA4NDc4MzF9.tAKGcABFXNd2dRsvf3lZ-4KzUvKGeUkmuhrzGKdfLpo',
      },
    };
    return userRo;
  }
  public async findOne(_loginUserDto: LoginUserDto): Promise<UserEntity> {
    const user = new UserEntity();
    user.id = 1;
    user.username = 'test-pa';
    user.password =
      'c90f86e09c3461da52b3d8bc80ccd6a0d0cb893b1a41bd461e8ed31fa21c9b6e';
    return user;
  }
  public generateJWT(_user): string {
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
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();
      userService = module.get<UserService>(UserService);
      userController = module.get<UserController>(UserController);
    },
  );

  describe('findMe', (): void => {
    it('should return a user', async (): Promise<void> => {
      const spy = jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((): Promise<UserRO> => Promise.resolve(userRo));
      const controllerResult = await userController.findMe('test-pa');

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(userRo);
    });
  });

  describe('login', (): void => {
    it('should return a user', async (): Promise<void> => {
      const loginParameters = {
        username: 'test-pa',
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
        username: 'test-pa',
        password: 'string',
      };
      const spy = jest
        .spyOn(userService, 'create')
        .mockImplementation((): Promise<UserRO> => Promise.resolve(userRo));
      const controllerResult = await userController.create(userValue);

      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toEqual(userRo);
    });
  });
});
