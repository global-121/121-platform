import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';

type AmbiguousOrFailState =
  | CooperativeBankOfOromiaDisbursementResultEnum.fail
  | CooperativeBankOfOromiaDisbursementResultEnum.ambiguous;

// From the perspective of the CooperativeBankOfOromia Service, an error is either a fail or ambiguous state.
// Duplicate and success states are not considered errors
export class CooperativeBankOfOromiaError extends Error {
  type: AmbiguousOrFailState;
  constructor(message: string, type: AmbiguousOrFailState) {
    super(message);
    this.message = `CooperativeBankOfOromia Error: ${message}`;
    this.name = 'CooperativeBankOfOromiaError';
    this.type = type;
  }
}
