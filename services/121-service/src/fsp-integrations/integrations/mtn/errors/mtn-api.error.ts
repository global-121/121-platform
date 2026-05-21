import { MtnTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-error-types.enum';

export class MtnApiError extends Error {
  type: MtnTransferErrorTypes;

  constructor({
    type,
    message,
  }: {
    type: MtnTransferErrorTypes;
    message: string;
  }) {
    super(`MTN API Error: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'MtnApiError';
    this.type = type;
  }
}
