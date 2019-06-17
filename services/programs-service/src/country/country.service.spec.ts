import { CountryService } from "./country.service";
import { Test, TestingModule } from '@nestjs/testing';
import { CountryEntity } from "./country.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "../user/user.entity";
import { repositoryMockFactory } from '../mock/repositoryMock.factory';

describe("Country service", () => {
  let service: CountryService;
  let module: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountryService,
        { provide: getRepositoryToken(CountryEntity), useFactory: repositoryMockFactory },
        { provide: getRepositoryToken(UserEntity), useFactory: repositoryMockFactory }
      ],
    }).compile();

    service = module.get<CountryService>(CountryService);
  });

  afterAll(async () => {
    module.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
