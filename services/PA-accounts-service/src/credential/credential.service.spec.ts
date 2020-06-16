import { ApiService } from './../services/api.service';
import { HttpModule } from '@nestjs/common';
import { DataStorageService } from './../data-storage/data-storage.service';
import { UserImsApiService } from './../services/user-ims-api.service';
import { ProgramsServiceApiService } from './../services/programs-service-api.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { repositoryMockFactory } from '../mock/repositoryMock.factory';
import { DataStorageEntity } from '../data-storage/data-storage.entity';

describe('CredentialService', (): void => {
  let service: CredentialService;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
          ApiService,
          CredentialService,
          DataStorageService,
          ProgramsServiceApiService,
          UserImsApiService,
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

      service = module.get<CredentialService>(CredentialService);
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});
