import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';

export class IntersolveLoadResponseDto {
  public data: IntersolveLoadBodyDto;
  public status: number;
  public statusText?: string;
}

class IntersolveLoadBodyDto {
  public success: boolean;
  public errors: IntersolveReponseErrorDto[];
  public code: string;
  public correlationId: string;
  public data: IntersolveLoadResponseDataDto;
}

class IntersolveLoadResponseDataDto {
  public balances: IntersolveLoadResponseBalanceDto[];
}

class IntersolveLoadResponseBalanceDto {
  public quantity: IntersolveLoadResponseQuantityDto;
  public discountBudgetValue: number;
  public lastChangedAt: string;
}

class IntersolveLoadResponseQuantityDto {
  public assetCode: string;
  public value: number;
  public reserved: number;
}
