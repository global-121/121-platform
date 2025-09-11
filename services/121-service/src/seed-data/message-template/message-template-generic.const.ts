import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';

export const messageTemplateGeneric: SeedMessageTemplateConfig = {
  whatsappGenericMessage: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      en: 'enGeneric',
      nl: 'nlGeneric',
    },
  },
  whatsappPayment: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: true,
    contentSid: {
      en: 'enPayment',
      nl: 'nlPayment',
    },
  },
  whatsappVoucher: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'With this message you will receive:\n1. An Albert Heijn supermarket voucher (cadeaukaart) of [[amount]] units - this is the picture with the barcode.\n2. An explanation on how to use the voucher in Albert Heijn.\n\nIf you received more than one voucher this is because you had not yet received vouchers from previous weeks.\n\nThe value of each voucher is €[[amount]].\nYou can spend the vouchers at any Albert Heijn supermarket in the Netherlands.\n\nYou don’t have to spend everything at once. So keep the vouchers and re-use them until the €[[amount]] on each voucher is finished.\n\nYou will receive your €[[amount]] Albert Heijn voucher every week on Tuesday until:\n1. You are no longer on the list of our partner organisations.\n2. The end of the project (you will be informed two weeks in advance).\n\nDo you have questions? Send us a message on WhatsApp: https://wa.me/31600000000',
      nl: 'Dummy text NL: whatsappVoucher [[amount]] units',
    },
  },
  whatsappReply: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'This is an automated message, for questions please contact the Red Cross Helpdesk',
      nl: 'Dummy text NL: whatsappReply',
    },
  },
  new: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: 'Welcome to our program. Whitin a couple of days your request will be validated.',
      nl: 'Welkom bij dit programma. Binnen enkele dagen zal uw verzoek worden behandeld.',
    },
  },
  completed: {
    isSendMessageTemplate: false,
    isWhatsappTemplate: false,
    message: {
      en: "You're receiving this message because you've received your last payment from us. If you have any questions, please contact us.",
      nl: 'U krijgt dit bericht omdat u uw laatste betaling van ons heeft ontvangen. Mocht u hier vragen over hebben kunt u contact met ons opnemen.',
    },
  },
};
