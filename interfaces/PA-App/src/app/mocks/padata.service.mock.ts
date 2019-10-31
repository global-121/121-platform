
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
  store: () => new Promise<any>((resolve) => resolve('')),
  retrieve: () => new Promise<string>((resolve) => resolve('')),
  createAccount: () => new Promise<any>((resolve) => resolve('')),
};
