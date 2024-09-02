export interface SafaricomTransferParams {
  readonly transactionAmount: number;
  readonly programId: number;
  readonly paymentNr: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly registrationProgramId: number;
  readonly phoneNumber: string;
  readonly nationalId: string;
}
