import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { User } from './user.decorator';

const userRo = {
  user: {
    username: undefined,
    email: undefined,
    token: undefined,
    role: undefined,
    countryId: undefined,
  },
};

describe('User service', () => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should generate jwt that starts with ey', () => {
    const user = new UserEntity();
    user.id = 909;
    const result = service.generateJWT(user);
    expect(result).toMatch(/ey/);
  });

  it('Create should create a user and return userRO', async () => {
    const userRo = {
      user: {
        username: undefined,
        email: undefined,
        token: undefined,
        role: undefined,
        countryId: undefined,
      },
    };

    const result = await service.findById(1);
    result.user.token = undefined;

    expect(result).toStrictEqual(userRo);
  });

  it('Should find a user using ID', async () => {
    const userRo = {
      user: {
        username: undefined,
        email: undefined,
        token: undefined,
        role: undefined,
        countryId: undefined,
      },
    };

    const result = await service.findById(1);
    result.user.token = undefined;

    expect(result).toStrictEqual(userRo);
  });

  it('Should find a user using email', async () => {
    const userRo = {
      user: {
        username: undefined,
        email: 'test@test.nl',
        token: undefined,
        role: undefined,
        countryId: undefined,
      },
    };

    const result = await service.findByEmail('test@test.nl');
    result.user.token = undefined;

    expect(result).toStrictEqual(userRo);
  });

  afterAll(async () => {
    module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
