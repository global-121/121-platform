import { type Mocked, TestBed } from '@suites/unit';
import { Job } from 'bull';

import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { MessageIncomingProcessor } from '@121-service/src/notifications/processors/message-incoming.processor';

const twilioIncommingMessage = {
  MessageSID: 'test',
  From: '31600000000',
  Waid: 'test',
  To: '31600000000',
  Body: 'test',
};

const testJob = { data: twilioIncommingMessage } as Job;

describe('Message processor(s)', () => {
  // All message processors are the same, so we only test one
  let messageIncommingService: Mocked<MessageIncomingService>;
  let messageIncommingProcessor: MessageIncomingProcessor;

  beforeAll(async () => {
    const { unit, unitRef } = await TestBed.solitary(
      MessageIncomingProcessor,
    ).compile();

    messageIncommingProcessor = unit;
    messageIncommingService = unitRef.get(MessageIncomingService);
  });

  it('should call sendMessage', async () => {
    // Arrange
    messageIncommingService.processIncomingWhatsapp.mockResolvedValue();

    // Act
    await messageIncommingProcessor.handleIncomingWhatsapp(testJob);

    // Assert
    expect(
      messageIncommingService.processIncomingWhatsapp,
    ).toHaveBeenCalledTimes(1);
  });
});
