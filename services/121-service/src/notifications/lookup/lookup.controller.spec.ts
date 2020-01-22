import { Test, TestingModule } from '@nestjs/testing';
import { LookupController } from './lookup.controller';

describe('Lookup Controller', () => {
  let controller: LookupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LookupController],
    }).compile();

    controller = module.get<LookupController>(LookupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
