import { LookupService } from './lookup.service';
import { Test, TestingModule } from '@nestjs/testing';
import { LookupController } from './lookup.controller';

class LookupServiceMock {}

describe('Lookup Controller', () => {
  let lookupController: LookupController;
  let lookupService: LookupService;

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
      lookupService = module.get<LookupService>(LookupService);
      lookupController = module.get<LookupController>(LookupController);
    },
  );

  it('should be defined', () => {
    expect(lookupController).toBeDefined();
  });



});
