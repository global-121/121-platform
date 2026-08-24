import { AlfouadApiResponseState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-response-state.enum';

export interface AlfouadCreateTransactionResult {
  readonly state: AlfouadApiResponseState;
  readonly message: string;
  readonly errorCode?: string;
}
