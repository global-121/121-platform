import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';
import { TransactionsIntersolveApiDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/transactions-intersolve-api.dto';

export interface GetTransactionsResponseIntersolveVisaDto {
  data: {
    success: boolean;
    errors?: ErrorsInResponse[];
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
