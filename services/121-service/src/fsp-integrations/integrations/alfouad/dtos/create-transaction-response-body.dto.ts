import { CreateTransferResult } from "@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-result.interface";

export interface AlfouadApiCreateTransactionResponseBody {
  readonly State: string;
  readonly Message: string;
  readonly ErrorCode?: string | null;
  readonly TransactionInfo?: CreateTransferResult | null;
}
