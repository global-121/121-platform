import { CredentialEntity } from './credential.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { CredentialRequestEntity } from './credential-request.entity';
import { ProgramEntity } from '../../programs/program/program.entity';

describe('CredentialService', (): void => {
  let service: CredentialService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CredentialService,
          {
            provide: getRepositoryToken(CredentialAttributesEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CredentialRequestEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CredentialEntity),
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
