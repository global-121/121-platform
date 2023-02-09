export class IntersolveIssueTokenResponseDto {
  public body: IntersolveIssueTokenBodyDto;
  public statusCode: number;
}

class IntersolveIssueTokenBodyDto {
  public success: boolean;
  public errors: IntesolveReponseErrorDto[];
  public code: string;
  public correlationId: string;
  public data: IntersolveIssueTokenResponseDataDto;
}

class IntersolveIssueTokenResponseDataDto {
  public token: IntersolveIssueTokenResponseTokenDto;
}

class IntersolveIssueTokenResponseTokenDto {
  public code: string;
  public blocked: boolean;
  public blockReasonCode: string;
  public type: string;
  public tier: string;
  public brandTypeCode: string;
  public expiresAt: string;
  public status: string;
  public holderId: string;
  public balances: IntersolveIssueTokenResponseBalanceDto[];
  public assets: IntersolveIssueTokenResponseAssetDto[];
}

class IntersolveIssueTokenResponseBalanceDto {
  public quantity: IntersolveIssueTokenResponseQuantityDto;
  public discountBudgetValue: number;
  public lastChangedAt: string;
}

class IntersolveIssueTokenResponseQuantityDto {
  public assetCode: string;
  public value: number;
  public reserved: number;
}

class IntersolveIssueTokenResponseAssetDto {
  public identity: IntersolveIssueTokenResponseIdentityDto;
  public groupCode: string;
  public parentAssetCode: string;
  public name: string;
  public description: string;
  public status: string;
  public minorUnit: number;
  public tags: string[];
  public expiresAt: string;
  public conversions: IntersolveIssueTokenResponseConversionDto[];
  public images: IntersolveIssueTokenResponseImageDto[];
}

class IntersolveIssueTokenResponseIdentityDto {
  public type: string;
  public subType: string;
  public code: string;
}

class IntersolveIssueTokenResponseConversionDto {
  public toAssetCode: string;
  public automatic: boolean;
  public fromQuantity: number;
  public toQuantity: number;
}

class IntersolveIssueTokenResponseImageDto {
  public type: string;
  public url: string;
  public description: string;
}

export class IntesolveReponseErrorDto {
  public code: string;
  public field: string;
  public description: string;
}
