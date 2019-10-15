export const MockPaDataService = {
  type: {
    language: '',
    country: '',
    did: '',
    didShort: '',
    wallet: '',
    credentialRequest: '',
    programId: '',
    credDefId: '',
    timeslot: '',
  },
  store: () => new Promise<any>((resolve) => resolve('')),
  retrieve: () => new Promise<string>((resolve) => resolve('')),
  createAccount: () => new Promise<any>((resolve) => resolve('')),
};

