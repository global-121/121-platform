import { MessageProcessType } from '@121-service/src/notifications/dto/message-job.dto';
import { QueueNames } from '@121-service/src/queues-registry/enum/queue-names.enum';

export class MessageQueueMap {
  types: MessageProcessType[];
  queueName: QueueNames;
  bulkSizeQueueName?: BulkSizePriority[];
}

// The bulk size is the amount of messages that will be sent at once
enum BulkSize {
  SMALL = 50,
  MEDIUM = 500,
  LARGE = 1000000000, // Large number so it will always be the last one
}

class BulkSizePriority {
  bulkSize: BulkSize;
  queueName: QueueNames;
}

// Fallback priority if no mapping is found
export const DEFAULT_QUEUE_CREATE_MESSAGE = QueueNames.createMessageSmallBulk;

// Priority steps of 100 so we can add more in between if needed
// The lower the priority the sooner the message will be sent
// We expect pending process types to not come in with as many at once as the templated messages
// Also because more replies push down the priority of templated messages we naturally get get less replies if many of the pending messages are prioritized
export const MESSAGE_QUEUE_MAP: MessageQueueMap[] = [
  // These are all replies to a message from the user that so they should be sent as soon as possible
  {
    types: [
      MessageProcessType.whatsappPendingVoucher,
      MessageProcessType.whatsappVoucherInstructions,
      MessageProcessType.whatsappPendingMessage,
      MessageProcessType.whatsappDefaultReply,
    ],
    queueName: QueueNames.createMessageReplyOnIncoming,
  },
  // These are messages of which we know they are not a reply to a message from the user, so they can be sent later
  {
    types: [
      MessageProcessType.sms,
      MessageProcessType.whatsappTemplateVoucher,
      MessageProcessType.whatsappTemplateGeneric,
      MessageProcessType.tryWhatsapp, // tryWhatsapp is similar priority as whatsappTemplateGeneric but we don't know if the user has WhatsApp-ed the reply and this sends the same message
    ],
    queueName: QueueNames.createMessageSmallBulk,
    bulkSizeQueueName: [
      {
        bulkSize: BulkSize.SMALL,
        queueName: QueueNames.createMessageSmallBulk,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        queueName: QueueNames.createMessageMediumBulk,
      },
      {
        bulkSize: BulkSize.LARGE,
        queueName: QueueNames.createMessageLargeBulk,
      },
    ],
  },
  {
    types: [MessageProcessType.whatsappTemplateVoucherReminder],
    queueName: QueueNames.createMessageLowPriority,
  },
];
