import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { TwilioMessageEntity } from './twilio.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';

describe('SmsService', () => {
  let service: SmsService;
  let module: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: getRepositoryToken(TwilioMessageEntity),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
