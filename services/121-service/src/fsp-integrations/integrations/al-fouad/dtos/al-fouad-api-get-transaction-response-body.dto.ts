import { AlFouadApiTransactionState } from "@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum";

export interface AlFouadApiGetTransactionResponseBodyDto {
  readonly State: AlFouadApiTransactionState;
  readonly Message: string;
  readonly ErrorCode?: string;
}
