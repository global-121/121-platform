import { Test, TestingModule } from '@nestjs/testing';
import { CredentialController } from './credential.controller';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';
import { CredentialService } from './credential.service';

class CredentialnServiceMock {
  public async getOffer(did: string): Promise<EncryptedMessageDto> {
    did;
    const result = { message: 'encrypted:example' };
    return result;
  }
  public async request(connectionResponse: EncryptedMessageDto): Promise<void> {
    connectionResponse;
  }
  public async issue(credentialValues: CredentialValuesDto): Promise<void> {
    credentialValues;
  }
  public async get(did: string): Promise<EncryptedMessageDto> {
    did;
    const result = { message: 'encrypted:example' };
    return result;
  }
}

describe('Credential Controller', (): void => {
  let controller: CredentialController;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [CredentialController],
        providers: [
          {
            provide: CredentialService,
            useValue: new CredentialnServiceMock(),
          },
        ],
      }).compile();

      controller = module.get<CredentialController>(CredentialController);
    },
  );

  it('should be defined', (): void => {
    expect(controller).toBeDefined();
  });
});
