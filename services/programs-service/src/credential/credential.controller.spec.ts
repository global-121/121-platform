import { Test, TestingModule } from '@nestjs/testing';
import { CredentialController } from './credential.controller';

describe('Credential Controller', (): void => {
  let controller: CredentialController;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [CredentialController],
      }).compile();

      controller = module.get<CredentialController>(CredentialController);
    },
  );

  it('should be defined', (): void => {
    expect(controller).toBeDefined();
  });
});
