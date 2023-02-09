import { IntesolveReponseErrorDto } from './intersolve-issue-token-response.dto';

export class IntersolveLoadResponseDto {
  public body: IntersolveLoadBodyDto;
  public statusCode: number;
}

class IntersolveLoadBodyDto {
  public success: boolean;
  public errors: IntesolveReponseErrorDto[];
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
