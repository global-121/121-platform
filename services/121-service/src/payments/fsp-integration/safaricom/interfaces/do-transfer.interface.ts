export interface DoTransferParams {
  readonly transactionAmount: number;
  readonly programId: number;
  readonly paymentNr: number;
  readonly userId: number;
  readonly referenceId: string;
  readonly phoneNumber: string;
  readonly idNumber: string;
  readonly registrationProgramId: number;
}
