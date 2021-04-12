import { Test, TestingModule } from '@nestjs/testing';
import { CredentialController } from './credential.controller';
import { EncryptedMessageDto } from '../encrypted-message-dto/encrypted-message.dto';
import { CredentialValuesDto } from './dto/credential-values.dto';
import { CredentialService } from './credential.service';
import { RolesGuard } from '../../roles.guard';

const did = {
  did: 'did:sov:exampleExampleExample',
};

const encryptedMessage = {
  message: 'encrypted:example',
};

const credRequest = {
  did: 'did:sov:exampleExampleExample',
  programId: 1,
  encryptedCredentialRequest: 'encrypted:example',
};

const cred = {
  did: 'did:sov:exampleExampleExample',
  programId: 1,
  attributes: [],
  credentialJson: JSON.parse('{ "encrypted" :"example" }'),
};
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
  let credentialService: CredentialService;
  let credentialController: CredentialController;

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
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();
      credentialService = module.get<CredentialService>(CredentialService);

      credentialController = module.get<CredentialController>(
        CredentialController,
      );
    },
  );

  it('should be defined', (): void => {
    expect(credentialController).toBeDefined();
  });

  describe('offer', (): void => {
    it('should get a credential offer', async (): Promise<void> => {
      const spy = jest
        .spyOn(credentialService, 'getOffer')
        .mockImplementation(
          (): Promise<EncryptedMessageDto> => Promise.resolve(encryptedMessage),
        );

      const controllerResult = await credentialController.getOffer(did);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(encryptedMessage);
    });
  });

  describe('request', (): void => {
    it('should post credential request', async (): Promise<void> => {
      const spy = jest
        .spyOn(credentialService, 'request')
        .mockImplementation((): Promise<void> => Promise.resolve());

      await credentialController.request(credRequest);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('issue', (): void => {
    it('should issue credential', async (): Promise<void> => {
      const spy = jest
        .spyOn(credentialService, 'issue')
        .mockImplementation((): Promise<void> => Promise.resolve());

      await credentialController.issue(cred);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('get', (): void => {
    it('should get a credential offer', async (): Promise<void> => {
      const spy = jest
        .spyOn(credentialService, 'get')
        .mockImplementation(
          (): Promise<EncryptedMessageDto> => Promise.resolve(encryptedMessage),
        );

      const controllerResult = await credentialController.get(did);
      expect(spy).toHaveBeenCalled();
      expect(controllerResult).toStrictEqual(encryptedMessage);
    });
  });
});
