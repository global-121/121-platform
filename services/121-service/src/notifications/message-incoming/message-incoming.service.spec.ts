import { TestBed } from '@automock/jest';
import { Queue } from 'bull';
import { getQueueName } from '../../utils/unit-test.helpers';
import {
  ProcessName,
  QueueNameMessageCallBack,
} from '../enum/queue.names.enum';
import { TwilioStatusCallbackDto } from '../twilio.dto';
import { MessageIncomingService } from './message-incoming.service';

describe('MessageIncomingService', () => {
  let messageIncomingService: MessageIncomingService;
  let messageStatusCallbackQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingService).compile();

    messageIncomingService = unit;
    messageStatusCallbackQueue = unitRef.get(
      getQueueName(QueueNameMessageCallBack.status),
    );
  });

  it('should be defined', () => {
    expect(messageIncomingService).toBeDefined();
  });

  it('should add SMS status callback to queue', async () => {
    // Arrange
    const testCallbackData = new TwilioStatusCallbackDto();

    // Act
    await messageIncomingService.addSmsStatusCallbackToQueue(testCallbackData);

    // Assert
    expect(messageStatusCallbackQueue.add).toHaveBeenCalledTimes(1);
    expect(messageStatusCallbackQueue.add).toHaveBeenCalledWith(
      ProcessName.sms,
      testCallbackData,
    );
  });

  it('should add WhatsApp status callback to queue', async () => {
    // Arrange
    const testCallbackData = new TwilioStatusCallbackDto();

    // Act
    await messageIncomingService.addWhatsappStatusCallbackToQueue(
      testCallbackData,
    );

    // Assert
    expect(messageStatusCallbackQueue.add).toHaveBeenCalledTimes(1);
    expect(messageStatusCallbackQueue.add).toHaveBeenCalledWith(
      ProcessName.whatsapp,
      testCallbackData,
    );
  });
});
