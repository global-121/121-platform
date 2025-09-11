import { SeedMessageTemplateConfig } from '@121-service/src/seed-data/message-template/interfaces/seed-message-template-config.interface';

export const demoMessageTemplates: SeedMessageTemplateConfig = {
  included: {
    isSendMessageTemplate: true,
    label: {
      en: 'Include',
    },
    isWhatsappTemplate: false,
    message: {
      en: 'Dear {{fullName}},\n\nThis is a message from the Red Cross.\n\nYou have been included in the program. You will receive 2 rounds of mobile money transfers. The amount you receive is based on the number of people in your household.',
    },
  },
  declined: {
    isSendMessageTemplate: true,
    label: {
      en: 'Declined',
    },
    isWhatsappTemplate: false,
    message: {
      en: 'Dear {{fullName}},\n\nThis is a message from the Red Cross.\n\nWe regret to inform you that you have not been selected for the program at this time. If you have any questions, please contact us.',
    },
  },
  pdmMessage: {
    isSendMessageTemplate: true,
    label: {
      en: 'PDM invitation',
    },
    isWhatsappTemplate: false,
    message: {
      en: 'Dear {{fullName}},\n\nWe kindly invite you to participate in our Post Distribution Monitoring survey. Your feedback is important to us and will help improve our support. Please fill out the survey using the following link: https://ee.ifrc.org/x/h1ay6vQl\n\nThank you for your time.\n\nRed Cross',
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
