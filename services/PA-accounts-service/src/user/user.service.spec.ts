import { DataStorageEntity } from './../data-storage/data-storage.entity';
import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { DataStorageService } from '../data-storage/data-storage.service';

const userRo = {
  user: {
    id: undefined,
    username: 'test-pa',
    token: undefined,
  },
};

const createUserDto = {
  username: 'test-pa',
  password: 'string',
};

const LoginUserDto = {
  username: 'test-pa',
  password: 'string',
};

describe('User service', (): void => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserService,
          DataStorageService,
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(DataStorageEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<UserService>(UserService);
    },
  );

  it('should generate jwt that starts with ey', (): void => {
    const user = new UserEntity();
    user.id = 909;
    const result = service.generateJWT(user);
    expect(result).toMatch(/ey/);
  });

  it('Should find a user using username', async (): Promise<void> => {
    const result = await service.findByUsername('test-pa');
    result.user.token = undefined;

    expect(result).toStrictEqual(userRo);
  });

  afterAll(
    async (): Promise<void> => {
      module.close();
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});
