import { LookupService } from './lookup.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupController } from './lookup.controller';

class LookupServiceMock {}

describe('Lookup Controller', () => {
  let lookupController: LookupController;

  beforeEach(
    async (): Promise<void> => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [LookupController],
        providers: [
          {
            provide: LookupService,
            useValue: new LookupServiceMock(),
          },
        ],
      }).compile();
      lookupController = module.get<LookupController>(LookupController);
    },
  );

  it('should be defined', () => {
    expect(lookupController).toBeDefined();
  });
});
