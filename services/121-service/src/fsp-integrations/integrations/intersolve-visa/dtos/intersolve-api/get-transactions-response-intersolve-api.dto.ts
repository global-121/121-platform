import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';
import { TransactionsIntersolveApiDto } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/transactions-intersolve-api.dto';

export interface GetTransactionsResponseIntersolveVisaDto {
  data: {
    success: boolean;
    errors?: ErrorsInResponseIntersolveApi[];
    code: string;
    correlationId: string;
    data?: TransactionsIntersolveApiDto[];
    start?: number;
    limit?: number;
    count?: number;
    total?: number;
  };
  status: number;
  statusText: string;
}
