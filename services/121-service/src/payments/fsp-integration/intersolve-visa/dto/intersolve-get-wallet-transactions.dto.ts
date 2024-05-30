import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';

export class TransactionInfoVisa {
  public lastUsedDate: Date | null;
  public spentThisMonth: number;
}

export class GetTransactionsDetailsResponseDto {
  data: GetTransactionsDetailsResponseBodyDto;
  status: number;
  statusText: string;
}

class GetTransactionsDetailsResponseBodyDto {
  public success: boolean;
  public errors?: ErrorsInResponseDto[];
  public code: string;
  public correlationId: string;
  public data?: IntersolveGetTransactionsResponseDataDto[];
  public start?: number;
  public limit?: number;
  public count?: number;
  public total?: number;
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
