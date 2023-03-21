import { of } from 'rxjs';
import { PaDataTypes } from '../services/padata-types.enum';
import { mockProgram } from './api.program.mock';

export const MockPaDataService = {
  type: PaDataTypes,
  authenticationState$: of(null),
  isOffline: false,
  myAnswers: {},
  checkAuthenticationState: () => {},
  clearDataStorage: () => {},
  createAccount: () => Promise.resolve(''),
  deleteData: () => Promise.resolve(),
  findInLocalStorage: () => {},
  getAllPrograms: () => Promise.resolve([mockProgram]),
  getCurrentProgram: () => Promise.resolve(mockProgram),
  getCurrentProgramId: () => Promise.resolve(mockProgram.id),
  getFspById: () => Promise.resolve(),
  getInstance: () => Promise.resolve(),
  getPaBatch: () => {},
  getProgram: () => Promise.resolve(mockProgram),
  getReferenceId: () => Promise.resolve(''),
  getUserFromStorage: () => {},
  login: () => Promise.resolve(''),
  logout: () => Promise.resolve(),
  retrieve: () => Promise.resolve(''),
  saveAnswers: () => Promise.resolve(''),
  savePaToBatch: () => {},
  saveUserInStorage: () => {},
  setCurrentProgramId: () => Promise.resolve(''),
  setLoggedIn: () => {},
  setLoggedOut: () => {},
  store: () => Promise.resolve(''),
};
