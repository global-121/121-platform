import { MessageProcessType } from '@121-service/src/notifications/message-job.dto';
import { QueueNameCreateMessage } from '@121-service/src/shared/enum/queue-process.names.enum';

export class MessageQueueMap {
  types: MessageProcessType[];
  queueName: QueueNameCreateMessage;
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
  queueName: QueueNameCreateMessage;
}

// Fallback priority if no mapping is found
export const DEFAULT_QUEUE_CREATE_MESSAGE = QueueNameCreateMessage.smallBulk;

// Priority steps of 100 so we can add more in between if needed
// The lower the prio the sooner the message will be sent
// We expect pending process types to not come in with as many at once as the templated messages
// Also because more replies push down the prio of templated messages we naturally get get less replies if many of the pending messages are prioritized
export const MESSAGE_QUEUE_MAP: MessageQueueMap[] = [
  // These are all replies to a message from the user that so they should be sent as soon as possible
  {
    types: [
      MessageProcessType.whatsappPendingVoucher,
      MessageProcessType.whatsappVoucherInstructions,
      MessageProcessType.whatsappPendingMessage,
      MessageProcessType.whatsappDefaultReply,
    ],
    queueName: QueueNameCreateMessage.replyOnIncoming,
  },
  // These are messages of which we know they are not a reply to a message from the user, so they can be sent later
  {
    types: [
      MessageProcessType.sms,
      MessageProcessType.whatsappTemplateVoucher,
      MessageProcessType.whatsappTemplateGeneric,
      MessageProcessType.tryWhatsapp, // Try whatsapp is similair prio as whatsappTemplateGeneric but we don't know if the user has whatsapp the reply and this send the the same message
    ],
    queueName: QueueNameCreateMessage.smallBulk,
    bulkSizeQueueName: [
      {
        bulkSize: BulkSize.SMALL,
        queueName: QueueNameCreateMessage.smallBulk,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        queueName: QueueNameCreateMessage.mediumBulk,
      },
      {
        bulkSize: BulkSize.LARGE,
        queueName: QueueNameCreateMessage.largeBulk,
      },
    ],
  },
  {
    types: [MessageProcessType.whatsappTemplateVoucherReminder],
    queueName: QueueNameCreateMessage.lowPriority,
  },
];
