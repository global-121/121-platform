import { AlfouadApiResponseStateEnum } from "@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-response-state.enum";

export interface AlfouadApiCreateTransactionResponseDto {
  readonly State: AlfouadApiResponseStateEnum;
  readonly Message: string;
  readonly ErrorCode?: string | null;
}
