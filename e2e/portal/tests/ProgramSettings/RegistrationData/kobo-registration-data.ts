import { env } from '@121-service/src/env';

export const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/success-asset/summary`,
  apiKey: 'mock-token',
};

export const kobooAttributes = [
  { name: 'What_is_2_2_number', label: 'What is 2+2 (number)?' },
  {
    name: 'How_are_you_today_select_one',
    label: 'How are you today (select one)?',
  },
];
