import { TestBed } from '@automock/jest';
import { AzureLogService } from '../../shared/services/azure-log.service';
import { MessageContentType } from '../enum/message-type.enum';
import { MessageJobDto, MessageProccessType } from '../message-job.dto';
import { MessageService } from '../message.service';
import { MessageProcessor } from './message.processor';
import { LanguageEnum } from '../../registration/enum/language.enum';
import { Job } from 'bull';

const messageJob: MessageJobDto = {
  id: 1,
  referenceId: 'test-ref',
  preferredLanguage: LanguageEnum.en,
  whatsappPhoneNumber: '1234567890', // Update with actual value
  phoneNumber: '1234567890', // Update with actual value
  programId: 1,
  message: 'test message',
  key: 'key',
  tryWhatsApp: true,
  messageContentType: MessageContentType.custom,
  messageProcessType: MessageProccessType.whatsappTemplateGeneric,
};
const job = { data: messageJob } as Job;

describe('Message processor unit test', () => {
  let messageProcessor: MessageProcessor;
  let messageService: jest.Mocked<MessageService>;
  let azureLogService: jest.Mocked<AzureLogService>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageProcessor).compile();

    messageProcessor = unit;
    messageService = unitRef.get(MessageService);
    azureLogService = unitRef.get(AzureLogService);
  });

  it('should call sendMessage', async () => {
    messageService.sendTextMessage.mockReturnValue(Promise.resolve());
    await messageProcessor.handleSend(job);
    expect(messageService.sendTextMessage).toHaveBeenCalled();
  });

  it('should call logError on AzureLogService if sendTextMessage fails', async () => {
    // Make sendTextMessage reject with an error
    const error = new Error('Test error');
    messageService.sendTextMessage.mockReturnValue(Promise.reject(error));

    try {
      await messageProcessor.handleSend(job);
    } catch (e) {
      // Ignore the error here, we are interested in the logging
    }

    // Check if logError was called with the correct error
    expect(azureLogService.logError).toHaveBeenCalledWith(error, false);
  });
});
