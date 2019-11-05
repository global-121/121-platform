import { Test, TestingModule } from '@nestjs/testing';
import { VoiceService } from './voice.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TwilioMessageEntity } from '../twilio.entity';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';

describe('VoiceService', () => {
  let service: VoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceService,
        {
          provide: getRepositoryToken(TwilioMessageEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<VoiceService>(VoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
