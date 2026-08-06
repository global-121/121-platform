import { AlfouadTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-transfer-error-types.enum';

export class AlfouadApiError extends Error {
  type: AlfouadTransferErrorTypes;

  constructor({
    type,
    message,
  }: {
    type: AlfouadTransferErrorTypes;
    message: string;
  }) {
    super(`Alfouad API Error: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AlfouadApiError';
    this.type = type;
  }
}
