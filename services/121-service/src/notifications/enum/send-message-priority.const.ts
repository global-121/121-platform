import { MessageProccessType } from '../message-job.dto';

export class MessagePriorityMap {
  types: MessageProccessType[];
  priority: number;
  bulkSizePriority?: BulkSizePriority[];
}

// The bulk size is the amount of messages that will be sent at once
enum BulkSize {
  SMALL = 50,
  MEDIUM = 500,
  LARGE = 1000000000, // Large number so it will always be the last one
}
// This is an optional priority if it is missing the default priority is used
class BulkSizePriority {
  bulkSize: BulkSize;
  priority: number;
}

// Fallback priority if no mapping is found
export const DEFAULT_PRIORITY = 150;

// Priority steps of 100 so we can add more in between if needed
// The lower the prio the sooner the message will be sent
// We expect pending process types to not come in with as many at once as the templated messages
// Also because more replies push down the prio of templated messages we naturally get get less replies if many of the pending messages are prioritized
export const SEND_MESSAGE_PRIORITY: MessagePriorityMap[] = [
  // These are all replies to a message from the user that so they should be sent as soon as possible
  {
    types: [
      MessageProccessType.whatsappPendingVoucher,
      MessageProccessType.whatsappPendingInformation,
      MessageProccessType.whatsappNoPendingMessages,
    ],
    priority: 100,
  },
  // These are messages of which we know they are not a reply to a message from the user, so they can be sent later
  {
    types: [
      MessageProccessType.sms,
      MessageProccessType.whatappTemplateVoucher,
      MessageProccessType.whatsappTemplateGeneric,
      MessageProccessType.tryWhatsapp, // Try whatsapp is similair prio as whatsappTemplateGeneric but we don't know if the user has whatsapp the reply and this send the the same message
    ],
    priority: 200,
    bulkSizePriority: [
      {
        bulkSize: BulkSize.SMALL,
        priority: 200,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        priority: 300,
      },
      {
        bulkSize: BulkSize.LARGE,
        priority: 400,
      },
    ],
  },
  {
    types: [MessageProccessType.whatsappTemplateVoucherReminder],
    priority: 500,
  },
];
