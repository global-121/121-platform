import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { repositoryMockFactory } from '../../mock/repositoryMock.factory';
import { TwilioMessageEntity } from '../twilio.entity';
import { ProgramService } from '../../programs/program.service';
import { ProgramServiceMock } from '../../programs/program.controller.spec';

describe('SmsService', () => {
  let service: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: getRepositoryToken(TwilioMessageEntity),
          useFactory: repositoryMockFactory,
        },
        {
          provide: ProgramService,
          useValue: new ProgramServiceMock(),
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
