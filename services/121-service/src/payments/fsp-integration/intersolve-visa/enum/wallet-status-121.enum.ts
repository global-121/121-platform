// TODO: REFACTOR: Rename to 121VisaCardStatus probably, also rename and refactor other status mapping stuff.

export enum WalletCardStatus121 {
  Active = 'Active',
  Issued = 'Issued',
  Blocked = 'Blocked',
  Paused = 'Paused',
  SuspectedFraud = 'Suspected Fraud',
  Unknown = 'Unknown',
  Substituted = 'Substituted',
}
