import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '@121-service/src/notifications/twilio.dto';
import {
  ProcessNameMessage,
  QueueNameMessageCallBack,
} from '@121-service/src/shared/enum/queue-process.names.enum';
import { getQueueName } from '@121-service/src/utils/unit-test.helpers';
import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

describe('MessageIncomingService', () => {
  let messageIncomingService: MessageIncomingService;
  let messageStatusCallbackQueue: jest.Mocked<Queue>;
  let messageIncommingQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingService).compile();

    messageIncomingService = unit;
    messageStatusCallbackQueue = unitRef.get(
      getQueueName(QueueNameMessageCallBack.status),
    );

    messageIncommingQueue = unitRef.get(
      getQueueName(QueueNameMessageCallBack.incomingMessage),
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
      ProcessNameMessage.sms,
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
      ProcessNameMessage.whatsapp,
      testCallbackData,
    );
  });

  it('should add incoming WhatsApp to queue', async () => {
    // Arrange
    const testIncommingWhatsappData = new TwilioIncomingCallbackDto();

    // Act
    await messageIncomingService.addIncomingWhatsappToQueue(
      testIncommingWhatsappData,
    );

    // Assert
    expect(messageIncommingQueue.add).toHaveBeenCalledTimes(1);
    expect(messageIncommingQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.whatsapp,
      testIncommingWhatsappData,
    );
  });
});
