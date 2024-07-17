import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

export interface GetTransactionsResponseDto {
  data: {
    success: boolean;
    errors?: ErrorsInResponse[];
    code: string;
    correlationId: string;
    data?: IntersolveGetTransactionsResponseDataDto[];
    start?: number;
    limit?: number;
    count?: number;
    total?: number;
  };
  status: number;
  statusText: string;
}

export interface IntersolveGetTransactionsResponseDataDto {
  id: number;
  quantity: { assetCode: string; value: number };
  createdAt: string;
  creditor: { tokenCode: string };
  debtor: { tokenCode: string | null };
  reference: string;
  type: string;
  description: string;
  location: { merchantCode: string; merchantLocationCode: string };
  originalTransactionId: number;
  paymentId: number;
}
