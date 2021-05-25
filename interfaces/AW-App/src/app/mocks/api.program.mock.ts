import { AnswerType, Program } from '../models/program.model';

export const mockProgram: Program = {
  id: 1,
  title: 'Program Test Title',
  description: 'Program Test Description',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  meetingDocuments: 'document;document;',
  ngo: 'NGO',
  customCriteria: [
    {
      id: 1,
      criterium: 'question1',
      label: {
        en: 'Question 1:',
      },
      answerType: AnswerType.Text,
      options: null,
    },
  ],
  financialServiceProviders: [],
};

export const fspData = {
  attributes: [
    {
      id: 1,
      name: 'personalId',
      label: {
        en: 'What is your national ID, so we can transfer money to your bank account',
      },
      options: null,
      answerType: 'text',
    },
  ],
  answers: {
    personalId: {
      code: 'personalId',
      value: 'vb',
    },
  },
  referenceId: '910c50be-f131-4b53-b06b-6506a40a2734',
};
