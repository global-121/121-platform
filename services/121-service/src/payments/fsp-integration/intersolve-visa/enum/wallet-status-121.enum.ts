// Not naming it 121VisaCardStatus, because starting a name with a number required it to be always in quotes, which is inconvenient.
export enum VisaCard121Status {
  Active = 'Active',
  Issued = 'Issued',
  Blocked = 'Blocked',
  Paused = 'Paused',
  SuspectedFraud = 'Suspected Fraud',
  Unknown = 'Unknown',
  Substituted = 'Substituted',
}
