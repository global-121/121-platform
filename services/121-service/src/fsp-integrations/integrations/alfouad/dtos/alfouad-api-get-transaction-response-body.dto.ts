import { AlfouadApiTransactionState } from "@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum";

export interface AlfouadApiGetTransactionResponseBodyDto {
  readonly State: AlfouadApiTransactionState;
  readonly Message: string;
  readonly ErrorCode?: string;
}
