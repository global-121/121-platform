import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';

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
  public errors?: IntersolveReponseErrorDto[];
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
  public debtor: { tokenCode: string };
  public reference: string;
  public type: string;
  public description: string;
  public location: { merchantCode: string; merchantLocationCode: string };
  public originalTransactionId: number;
  public paymentId: number;
}
