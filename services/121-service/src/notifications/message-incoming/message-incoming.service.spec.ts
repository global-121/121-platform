import { TestBed } from '@automock/jest';

import {
  TwilioIncomingCallbackDto,
  TwilioStatusCallbackDto,
} from '@121-service/src/notifications/dto/twilio.dto';
import { ProcessNameMessage } from '@121-service/src/notifications/enum/process-names.enum';
import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';

describe('MessageIncomingService', () => {
  let messageIncomingService: MessageIncomingService;
  let queuesService: QueuesRegistryService;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingService)
      .mock(QueuesRegistryService)
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
    queuesService = unitRef.get(QueuesRegistryService);
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
    expect(queuesService.messageStatusCallbackQueue.add).toHaveBeenCalledTimes(
      1,
    );
    expect(queuesService.messageStatusCallbackQueue.add).toHaveBeenCalledWith(
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
    expect(queuesService.messageStatusCallbackQueue.add).toHaveBeenCalledTimes(
      1,
    );
    expect(queuesService.messageStatusCallbackQueue.add).toHaveBeenCalledWith(
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
    expect(
      queuesService.messageIncomingCallbackQueue.add,
    ).toHaveBeenCalledTimes(1);
    expect(queuesService.messageIncomingCallbackQueue.add).toHaveBeenCalledWith(
      ProcessNameMessage.whatsapp,
      testIncommingWhatsappData,
    );
  });
});
