import { UserService } from "./user.service";
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from "./user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe("User service", () => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useFactory: repositoryMockFactory },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
