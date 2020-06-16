import { Test } from '@nestjs/testing';
import { CredentialController } from './credential.controller';
import { CredentialService } from './credential.service';
import { RolesGuard } from '../roles.guard';

describe('Credential Controller', (): void => {
  let credentialController: CredentialController;

  class CredentialServiceMock {}

  beforeEach(
    async (): Promise<void> => {
      const module = await Test.createTestingModule({
        controllers: [CredentialController],
        providers: [
          {
            provide: CredentialService,
            useValue: new CredentialServiceMock(),
          },
        ],
      })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: (): boolean => true })
        .compile();
      credentialController = module.get<CredentialController>(
        CredentialController,
      );
    },
  );

  it('should be defined', () => {
    expect(credentialController).toBeDefined();
  });
});
