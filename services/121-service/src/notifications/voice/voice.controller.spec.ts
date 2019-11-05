import { VoiceService } from './voice.service';
import { Test, TestingModule } from '@nestjs/testing';
import { VoiceController } from './voice.controller';

class VoiceServiceMock {}

describe('Voice Controller', () => {
  let controller: VoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceController],
      providers: [
        {
          provide: VoiceService,
          useValue: new VoiceServiceMock(),
        },
      ],
    }).compile();
    controller = module.get<VoiceController>(VoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
