import { Queue } from 'bull';
import { MessageIncomingService } from './message-incoming.service';
// Assuming the entities are in the same directory
import { TestBed } from '@automock/jest';
import { ProcessName } from '../enum/processor.names.enum';
import { TwilioStatusCallbackDto } from '../twilio.dto';

describe('MessageIncomingService', () => {
  let messageIncomingService: MessageIncomingService;
  let messageStatusCallbackQueue: jest.Mocked<Queue>;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingService).compile();

    messageIncomingService = unit;
    messageStatusCallbackQueue = unitRef.get('BullQueue_messageStatusCallback');
  });

  it('should be defined', () => {
    expect(messageIncomingService).toBeDefined();
  });

  it('should add sms status callback to queue', async () => {
    const callbackData = new TwilioStatusCallbackDto();

    await messageIncomingService.addSmsStatusCallbackToQueue(callbackData);

    expect(messageStatusCallbackQueue.add).toHaveBeenCalledWith(
      ProcessName.sms,
      callbackData,
    );
  });

  it('should add whatsapp status callback to queue', async () => {
    const callbackData = new TwilioStatusCallbackDto();

    await messageIncomingService.addWhatsappStatusCallbackToQueue(callbackData);

    expect(messageStatusCallbackQueue.add).toHaveBeenCalledWith(
      ProcessName.whatsapp,
      callbackData,
    );
  });
});
