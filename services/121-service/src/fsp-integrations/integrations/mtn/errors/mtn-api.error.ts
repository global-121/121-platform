import { MtnTransferResult } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';

type DuplicateOrFailState =
  | MtnTransferResult.fail
  | MtnTransferResult.duplicate;

export class MtnApiError extends Error {
  type: DuplicateOrFailState;

  constructor({
    type,
    message,
  }: {
    type: DuplicateOrFailState;
    message: string;
  }) {
    super(`MTN API Error: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'MtnApiError';
    this.type = type;
  }
}
