import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { CredentialEntity } from './credential.entity';

describe('CredentialService', (): void => {
  let service: CredentialService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CredentialService,
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
