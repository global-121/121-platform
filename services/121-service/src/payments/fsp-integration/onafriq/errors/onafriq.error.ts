import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';

export class OnafriqError extends Error {
  type:
    | OnafriqApiResponseStatusType.genericError
    | OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError;
  constructor(
    message: string,
    type:
      | OnafriqApiResponseStatusType.genericError
      | OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError,
  ) {
    super(message);
    this.name = 'OnafriqApiError';
    this.type = type;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
