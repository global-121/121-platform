import { AlfouadApiResponseState } from "@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-response-state.enum";

export interface AlfouadApiCreateTransactionResponseBodyDto {
  readonly State: AlfouadApiResponseState;
  readonly Message: string;
  readonly ErrorCode?: string;
}
