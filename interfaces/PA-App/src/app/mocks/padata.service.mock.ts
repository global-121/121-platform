import { of } from 'rxjs';
import { Program } from '../models/program.model';
import { PaDataTypes } from '../services/padata-types.enum';
import { mockProgram } from './api.program.mock';

export const MockPaDataService = {
  type: PaDataTypes,
  myPrograms: {},
  authenticationState$: of(false),
  getUsername: () => new Promise<string>((resolve) => resolve('')),
  getProgram: () => new Promise<Program>((resolve) => resolve(mockProgram)),
  getCurrentProgram: () =>
    new Promise<Program>((resolve) => resolve(mockProgram)),
  store: () => new Promise<any>((resolve) => resolve('')),
  retrieve: () => new Promise<string>((resolve) => resolve('')),
  createAccount: () => new Promise<any>((resolve) => resolve('')),
};
