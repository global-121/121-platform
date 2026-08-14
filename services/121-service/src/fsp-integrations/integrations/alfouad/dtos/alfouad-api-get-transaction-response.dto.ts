import { AlfouadApiTransactionStateEnum } from "@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum";

export interface AlfouadApiGetTransactionResponseDto {
  readonly State: AlfouadApiTransactionStateEnum;
  readonly Message: string;
  readonly ErrorCode?: string | null;
}
