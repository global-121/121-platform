import { OnafriqApiResponseStatusType } from '@121-service/src/fsp-integrations/integrations/onafriq/enum/onafriq-api-response-status-type.enum';

export interface CallServiceResult {
  status: OnafriqApiResponseStatusType;
  errorMessage?: string;
}
