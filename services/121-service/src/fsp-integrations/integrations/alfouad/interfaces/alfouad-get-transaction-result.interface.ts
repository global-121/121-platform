import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';

export interface AlfouadGetTransactionResult {
  readonly state: AlfouadApiTransactionStateEnum;
  readonly transactionUid?: string;
}
