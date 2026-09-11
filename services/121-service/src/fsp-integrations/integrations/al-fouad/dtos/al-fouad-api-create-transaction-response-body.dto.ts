import { AlFouadApiResponseState } from "@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-response-state.enum";

export interface AlFouadApiCreateTransactionResponseBodyDto {
  readonly State: AlFouadApiResponseState;
  readonly Message: string;
  readonly ErrorCode?: string;
}
