import { MessageContentType } from './message-type.enum';

export class MessagePriorityMap {
  types: MessageContentType[];
  priority: number;
  bulkSizePriority?: BulkSizePriority[];
}

// The bulk size is the amount of messages that will be sent at once
enum BulkSize {
  SMALL = 0,
  MEDIUM = 50,
  LARGE = 500,
}
// This is an optional priority if it is missing the default priority is used
class BulkSizePriority {
  bulkSize: BulkSize;
  priority: number;
}

// Fallback priority if no mapping is found
export const DEFAULT_PRIORITY = 150;

// This is the const that is used when whatsapp reply is trues
export const SEND_MESSAGE_PRIORITY_WHATSAPP_REPLY: MessagePriorityMap[] = [
  // These are all replies to a message from the user that are about the acutal voucher, so they should be sent as soon as possible
  {
    types: [
      MessageContentType.paymentVoucher,
      MessageContentType.paymentInstructions,
    ],
    priority: 100,
  },
  // These are all replies to a message from the user but no money attached to them, so they should be sent as soon as possible
  {
    types: [
      MessageContentType.registered,
      MessageContentType.included,
      MessageContentType.inclusionEnded,
      MessageContentType.rejected,
      MessageContentType.invited,
      MessageContentType.paused,
      MessageContentType.custom,
      MessageContentType.payment, //This message is just informative and not an actual voucher with money (therfore not prio 100
      MessageContentType.defaultReply,
    ],
    priority: 200,
  },
];

// Priority steps of 100 so we can add more in between if needed
// The lower the prio the sooner the message will be sent
// We expect replies to not come in with as many at once as the templated messages
// Also because more replies push down the prio of prioritized messages we naturally get get less replies if many of them are prioritized
export const SEND_MESSAGE_PRIORITY_WHATSAPP: MessagePriorityMap[] = [
  // These are all replies to a message from the user that are about the acutal voucher, so they should be sent as soon as possible
  {
    types: [
      MessageContentType.paymentVoucher,
      MessageContentType.paymentInstructions,
    ],
    priority: 100,
  },
  // These are all replies to a message from the user but no money attached to them, so they should be sent as soon as possible
  {
    types: [
      MessageContentType.registered,
      MessageContentType.included,
      MessageContentType.inclusionEnded,
      MessageContentType.rejected,
      MessageContentType.invited,
      MessageContentType.paused,
      MessageContentType.custom,
      MessageContentType.payment, //This message is just informative and not an actual voucher with money (therfore not prio 100
      MessageContentType.defaultReply,
    ],
    priority: 200,
  },
  // These are messages of which we know they are not a reply to a message from the user, so they can be sent later
  {
    types: [MessageContentType.paymentTemplated],
    priority: 300,
    bulkSizePriority: [
      {
        bulkSize: BulkSize.SMALL,
        priority: 300,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        priority: 1300,
      },
      {
        bulkSize: BulkSize.LARGE,
        priority: 2300,
      },
    ],
  },
  {
    types: [MessageContentType.genericTemplated],
    priority: 600,
    bulkSizePriority: [
      {
        bulkSize: BulkSize.SMALL,
        priority: 600,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        priority: 1600,
      },
      {
        bulkSize: BulkSize.LARGE,
        priority: 2600,
      },
    ],
  },
  {
    types: [MessageContentType.paymentReminder],
    priority: 3000,
  },
];

export const SEND_MESSAGE_PRIORITY_SMS: MessagePriorityMap[] = [
  // These are all replies to a message from the user that are about the acutal voucher, so they should be sent as soon as possible
  // These are all replies to a message from the user but no money attached to them, so they should be sent as soon as possible
  {
    types: [
      MessageContentType.registered,
      MessageContentType.included,
      MessageContentType.inclusionEnded,
      MessageContentType.rejected,
      MessageContentType.invited,
      MessageContentType.paused,
      MessageContentType.custom,
      MessageContentType.payment, //This message is just informative and not an actual voucher with money (therfore not prio 100)
    ],
    priority: 600,
    bulkSizePriority: [
      {
        bulkSize: BulkSize.SMALL,
        priority: 600,
      },
      {
        bulkSize: BulkSize.MEDIUM,
        priority: 1600,
      },
      {
        bulkSize: BulkSize.LARGE,
        priority: 2600,
      },
    ],
  },
  // These are messages of which we know they are not a reply to a message from the user, so they can be sent later
];
