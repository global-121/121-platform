import { TestBed } from '@automock/jest';
import { Job } from 'bull';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { MessageService } from '@121-service/src/notifications/message.service';
import {
  MessageJobDto,
  MessageProcessType,
} from '@121-service/src/notifications/message-job.dto';
import { MessageProcessorReplyOnIncoming } from '@121-service/src/notifications/processors/message.processor';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

const mockMessageJob: MessageJobDto = {
  registrationId: 1,
  referenceId: 'test-ref',
  preferredLanguage: LanguageEnum.en,
  whatsappPhoneNumber: '1234567890',
  phoneNumber: '1234567890',
  programId: 1,
  message: 'test message',
  messageTemplateKey: 'messageTemplateKey',
  messageContentType: MessageContentType.custom,
  messageProcessType: MessageProcessType.whatsappTemplateGeneric,
  userId: 1,
};
const testJob = { data: mockMessageJob } as Job;

describe('Message processor(s)', () => {
  // All message processors are the same, so we only test one
  let messageService: jest.Mocked<MessageService>;
  let messageProcessor: MessageProcessorReplyOnIncoming;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageProcessorReplyOnIncoming)
      .mock(MessageService)
      .using(messageService)
      .compile();

    messageProcessor = unit;
    messageService = unitRef.get(MessageService);
  });

  it('should call sendMessage', async () => {
    // Arrannge
    messageService.sendTextMessage.mockResolvedValue();

    // Act
    await messageProcessor.handleSend(testJob);

    // Assert
    expect(messageService.sendTextMessage).toHaveBeenCalledTimes(1);
  });
});
