import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';

export interface CallServiceResult {
  status: OnafriqApiResponseStatusType;
  errorMessage?: string;
}
