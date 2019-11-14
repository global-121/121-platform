import { Program } from '../models/program.model';

export const mockProgram: Program = {
  id: 1,
  title: 'Program Test Title',
  description: 'Program Test Description',
  countryId: 1,
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  meetingDocuments: 'document;document;',
  ngo: 'NGO',
  customCriteria: [],
  credDefId: '',
};
