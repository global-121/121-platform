import { AirtelDisbursementResultEnum } from '@121-service/src/fsp-integrations/api-integrations/airtel/enums/airtel-disbursement-result.enum';

type AmbiguousOrFailState =
  | AirtelDisbursementResultEnum.fail
  | AirtelDisbursementResultEnum.ambiguous;

// From the perspective of the Airtel Service, an error is either a fail or ambiguous state.
// Duplicate and success states are not considered errors
export class AirtelError extends Error {
  type: AmbiguousOrFailState;
  constructor(message: string, type: AmbiguousOrFailState) {
    super(message);
    this.message = `Airtel Error: ${message}`;
    this.name = 'AirtelError';
    this.type = type;
  }
}
