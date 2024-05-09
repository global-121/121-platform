import { MessageIncomingService } from '@121-service/src/notifications/message-incoming/message-incoming.service';
import { MessageIncomingProcessor } from '@121-service/src/notifications/processors/message-incoming.processor';
import { TestBed } from '@automock/jest';
import { Job } from 'bull';

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
  let messageIncommingService: jest.Mocked<MessageIncomingService>;
  let messageIncommingProcessor: MessageIncomingProcessor;

  beforeAll(() => {
    const { unit, unitRef } = TestBed.create(MessageIncomingProcessor)
      .mock(MessageIncomingService)
      .using(messageIncommingService)
      .compile();

    messageIncommingProcessor = unit;
    messageIncommingService = unitRef.get(MessageIncomingService);
  });

  it('should call sendMessage', async () => {
    // Arrannge
    messageIncommingService.processIncomingWhatsapp.mockResolvedValue();

    // Act
    await messageIncommingProcessor.handleIncomingWhatsapp(testJob);

    // Assert
    expect(
      messageIncommingService.processIncomingWhatsapp,
    ).toHaveBeenCalledTimes(1);
  });
});
