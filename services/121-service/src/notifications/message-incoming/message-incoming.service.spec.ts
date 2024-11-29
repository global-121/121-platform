import { TestBed } from '@automock/jest';

import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '@121-service/src/notifications/twilio.dto';
import { QueueRegistryService } from '@121-service/src/queue-registry/queue-registry.service';
import { ProcessNameMessage } from '@121-service/src/shared/enum/queue-process.names.enum';

describe('MessageIncomingService', () => {
  let messageIncomingService: MessageIncomingService;
  let queueRegistryService: QueueRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingService)
      .mock(QueueRegistryService)
      .using({
        messageStatusCallbackQueue: {
          add: jest.fn(),
        },
        messageIncomingCallbackQueue: {
          add: jest.fn(),
        },
      })
      .compile();

    messageIncomingService = unit;
    queueRegistryService = unitRef.get(QueueRegistryService);
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
    expect(
      queueRegistryService.messageStatusCallbackQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.messageStatusCallbackQueue.add,
    ).toHaveBeenCalledWith(ProcessNameMessage.sms, testCallbackData);
  });

  it('should add WhatsApp status callback to queue', async () => {
    // Arrange
    const testCallbackData = new TwilioStatusCallbackDto();

    // Act
    await messageIncomingService.addWhatsappStatusCallbackToQueue(
      testCallbackData,
    );

    // Assert
    expect(
      queueRegistryService.messageStatusCallbackQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.messageStatusCallbackQueue.add,
    ).toHaveBeenCalledWith(ProcessNameMessage.whatsapp, testCallbackData);
  });

  it('should add incoming WhatsApp to queue', async () => {
    // Arrange
    const testIncommingWhatsappData = new TwilioIncomingCallbackDto();

    // Act
    await messageIncomingService.addIncomingWhatsappToQueue(
      testIncommingWhatsappData,
    );

    // Assert
    expect(
      queueRegistryService.messageIncomingCallbackQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(
      queueRegistryService.messageIncomingCallbackQueue.add,
    ).toHaveBeenCalledWith(
      ProcessNameMessage.whatsapp,
      testIncommingWhatsappData,
    );
  });
});
