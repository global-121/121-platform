import { AvailabilityEntity } from './../schedule/appointment/availability.entity';
import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { ProgramEntity } from '../programs/program/program.entity';
import { StandardCriteriumEntity } from '../programs/standard-criterium/standard-criterium.entity';

const userRo = {
  user: {
    id: undefined,
    username: undefined,
    email: 'test@example.org',
    token: undefined,
    role: undefined,
    status: undefined,
    countryId: undefined,
    assignedProgramId: undefined,
  },
};

const createUserDto = {
  username: undefined,
  email: 'test@example.org',
  role: undefined,
  status: undefined,
  countryId: undefined,
  password: 'string',
};

const LoginUserDto = {
  email: 'test@example.org',
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
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(AvailabilityEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(StandardCriteriumEntity),
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

  it('Should find a user using email', async (): Promise<void> => {
    const result = await service.findByEmail('test@example.org');
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
