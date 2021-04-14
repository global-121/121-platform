import { Test, TestingModule } from '@nestjs/testing';
import { CredentialController } from './credential.controller';
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
  public async issue(credentialValues: CredentialValuesDto): Promise<void> {
    credentialValues;
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

  describe('issue', (): void => {
    it('should issue credential', async (): Promise<void> => {
      const spy = jest
        .spyOn(credentialService, 'issue')
        .mockImplementation((): Promise<void> => Promise.resolve());

      await credentialController.issue(cred);
      expect(spy).toHaveBeenCalled();
    });
  });
});
