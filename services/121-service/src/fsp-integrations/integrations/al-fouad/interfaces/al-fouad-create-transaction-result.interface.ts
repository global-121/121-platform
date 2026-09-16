import { AlFouadApiResponseState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-response-state.enum';

export interface AlFouadCreateTransactionResult {
  readonly state: AlFouadApiResponseState;
  readonly message: string;
  readonly errorCode?: string;
}
