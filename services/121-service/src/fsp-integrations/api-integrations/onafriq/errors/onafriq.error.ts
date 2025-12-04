import { OnafriqApiResponseStatusType } from '@121-service/src/fsp-integrations/api-integrations/onafriq/enum/onafriq-api-response-status-type.enum';
type TypeGenericOrDuplicateTransId =
  | OnafriqApiResponseStatusType.genericError
  | OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError;

export class OnafriqError extends Error {
  type: TypeGenericOrDuplicateTransId;
  constructor(message: string, type: TypeGenericOrDuplicateTransId) {
    super(message);
    this.name = 'OnafriqApiError';
    this.type = type;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
