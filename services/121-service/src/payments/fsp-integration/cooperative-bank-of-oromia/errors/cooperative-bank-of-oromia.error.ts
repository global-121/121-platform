import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';

type DuplicateOrFailState =
  | CooperativeBankOfOromiaTransferResultEnum.fail
  | CooperativeBankOfOromiaTransferResultEnum.duplicate;

// From the perspective of the CooperativeBankOfOromia Service, an error is either a fail or ambiguous state.
// Duplicate and success states are not considered errors
export class CooperativeBankOfOromiaError extends Error {
  type: DuplicateOrFailState;
  constructor(type: DuplicateOrFailState, message?: string) {
    super(message);
    this.message = `CooperativeBankOfOromia Error: ${message}`;
    this.name = 'CooperativeBankOfOromiaError';
    this.type = type;
  }
}
