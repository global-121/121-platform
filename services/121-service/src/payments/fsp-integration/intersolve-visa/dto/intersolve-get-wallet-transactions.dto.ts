import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class TransactionInfoVisa {
  public lastUsedDate: Date | null;
  public spentThisMonth: number;
}

// TODO: Make properties readonly
export class GetTransactionsResponseDto {
  public data: {
    success: boolean;
    errors?: ErrorsInResponseDto[];
    code: string;
    correlationId: string;
    data?: IntersolveGetTransactionsResponseDataDto[];
    start?: number;
    limit?: number;
    count?: number;
    total?: number;
  };
  public status: number;
  public statusText: string;
}

export class IntersolveGetTransactionsResponseDataDto {
  public id: number;
  public quantity: { assetCode: string; value: number };
  public createdAt: string;
  public creditor: { tokenCode: string };
  public debtor: { tokenCode: string | null };
  public reference: string;
  public type: string;
  public description: string;
  public location: { merchantCode: string; merchantLocationCode: string };
  public originalTransactionId: number;
  public paymentId: number;
}
