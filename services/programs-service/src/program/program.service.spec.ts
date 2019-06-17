import { ProgramService } from "./program.service";
import { Test, TestingModule } from '@nestjs/testing';
import { ProgramEntity } from "./program.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "../user/user.entity";
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe("Program service", () => {
  let service: ProgramService;
  let module: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramService,
        { provide: getRepositoryToken(ProgramEntity), useFactory: repositoryMockFactory },
        { provide: getRepositoryToken(UserEntity), useFactory: repositoryMockFactory }
      ],
    }).compile();

    service = module.get<ProgramService>(ProgramService);
  });

  afterAll(async () => {
    module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
