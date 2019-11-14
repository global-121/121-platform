import { Program } from '../models/program.model';
import { mockProgram } from './api.program.mock';

export const MockPaDataService = {
  type: {
    language: 'languageCode',
    country: 'countryId',
    did: 'did',
    didShort: 'didShort',
    wallet: 'wallet',
    credentialRequest: 'credentialRequest',
    programId: 'programId',
    credDefId: 'credDefId',
    timeslot: 'timeslotChoice',
    myPrograms: 'myPrograms',
    myAnswers: 'myAnswers',
  },
  myPrograms: {},
  getProgram: () => new Promise<Program>((resolve) => resolve(mockProgram)),
  getCurrentProgram: () => new Promise<Program>((resolve) => resolve(mockProgram)),
  store: () => new Promise<any>((resolve) => resolve('')),
  retrieve: () => new Promise<string>((resolve) => resolve('')),
  createAccount: () => new Promise<any>((resolve) => resolve('')),
};
