import { FundingService } from './../../funding/funding.service';
import { SmsService } from './../../notifications/sms/sms.service';
import { VoiceService } from './../../notifications/voice/voice.service';
import { CredentialEntity } from './../../sovrin/credential/credential.entity';
import { CredentialAttributesEntity } from './../../sovrin/credential/credential-attributes.entity';
import { ProofService } from './../../sovrin/proof/proof.service';
import { CredentialService } from './../../sovrin/credential/credential.service';
import { SchemaService } from './../../sovrin/schema/schema.service';
import { ConnectionEntity } from './../../sovrin/create-connection/connection.entity';
import { repositoryMockFactory } from './../../mock/repositoryMock.factory';
import { CustomCriterium } from './custom-criterium.entity';
import { ProgramService } from './program.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgramEntity } from './program.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../user/user.entity';
import { SchemaEntity } from '../../sovrin/schema/schema.entity';
import { CredentialRequestEntity } from '../../sovrin/credential/credential-request.entity';
import { HttpModule } from '@nestjs/common';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { TwilioMessageEntity } from '../../notifications/twilio.entity';
import { TransactionEntity } from './transactions.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { ActionEntity } from '../../actions/action.entity';
import { FspCallLogEntity } from '../fsp/fsp-call-log.entity';
import { FspService } from '../fsp/fsp.service';
import { FspApiService } from '../fsp/fsp-api.service';

describe('Program service', (): void => {
  let service: ProgramService;
  let module: TestingModule;

  beforeAll(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [HttpModule],
        providers: [
          ProgramService,
          SchemaService,
          CredentialService,
          VoiceService,
          SmsService,
          ProofService,
          FundingService,
          FspService,
          FspApiService,
          {
            provide: getRepositoryToken(ProgramEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(UserEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CustomCriterium),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ConnectionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(SchemaEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CredentialAttributesEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CredentialRequestEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(CredentialEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(FinancialServiceProviderEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(FspCallLogEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ProtectionServiceProviderEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(TwilioMessageEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(TransactionEntity),
            useFactory: repositoryMockFactory,
          },
          {
            provide: getRepositoryToken(ActionEntity),
            useFactory: repositoryMockFactory,
          },
        ],
      }).compile();

      service = module.get<ProgramService>(ProgramService);
    },
  );

  afterAll(
    async (): Promise<void> => {
      module.close();
    },
  );

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });
});
