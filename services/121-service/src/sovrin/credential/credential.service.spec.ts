import { UserEntity } from './../../user/user.entity';
import { CustomCriterium } from './../../programs/program/custom-criterium.entity';
import { ConnectionEntity } from './../create-connection/connection.entity';
import { SchemaEntity } from './../schema/schema.entity';
import { ProgramService } from './../../programs/program/program.service';
import { CredentialEntity } from './credential.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { CredentialAttributesEntity } from './credential-attributes.entity';
import { CredentialRequestEntity } from './credential-request.entity';
import { ProgramEntity } from '../../programs/program/program.entity';
import { AppointmentEntity } from '../../schedule/appointment/appointment.entity';
import { SchemaService } from '../schema/schema.service';
import { ProofService } from '../proof/proof.service';
import { HttpModule } from '@nestjs/common';

describe('CredentialService', (): void => {
  let service: CredentialService;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
          CredentialService,
          ProgramService,
          SchemaService,
          ProofService,
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
          {
            provide: getRepositoryToken(CredentialRequestEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(SchemaEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ConnectionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CustomCriterium),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(AppointmentEntity),
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
