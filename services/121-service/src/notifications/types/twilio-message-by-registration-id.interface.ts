import { TwilioMessageScopedRepository } from '@121-service/src/notifications/twilio-message.repository';

export type MessageByRegistrationId = Awaited<
  ReturnType<
    typeof TwilioMessageScopedRepository.prototype.getManyByRegistrationId
  >
>[0];
