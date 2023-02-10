export class IntersolveIssueTokenResponseDto {
  public body: IntersolveIssueTokenBodyDto;
  public statusCode: number;
}

export class IntersolveIssueTokenBodyDto {
  public success: boolean;
  public errors: IntersolveReponseErrorDto[];
  public code: string;
  public correlationId: string;
  public data: IntersolveIssueTokenResponseDataDto;
}

export class IntersolveIssueTokenResponseDataDto {
  public token: IntersolveIssueTokenResponseTokenDto;
}

export class IntersolveIssueTokenResponseTokenDto {
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
  public vatRegulation: IntersolveIssueTokenResponseVatRegulationDto;
  public termsAndConditions: IntersolveIssueTokenResponseTermsAndConditionsDto;
  public amount: number;
  public currency: string;
  public articleCode: string;
  public percentage: number;
  public rank: number;
  public unit: string;
  public promotionCode: string;
  public ticket: string;
  public chargeRestrictions: IntersolveIssueTokenResponseChargeRestrictionsDto;
  public allowedMethods: IntersolveIssueTokenResponseMethodMetadataDto[];
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
  public code: string;
  public type: string;
  public url: string;
  public description: string;
}

class IntersolveIssueTokenResponseVatRegulationDto {
  public code: string;
  public value: number;
}

class IntersolveIssueTokenResponseTermsAndConditionsDto {
  public url: string;
  public text: string;
}

class IntersolveIssueTokenResponseChargeRestrictionsDto {
  public product: IntersolveIssueTokenResponseIncludesExcludesDto;
  public productGroup: IntersolveIssueTokenResponseIncludesExcludesDto;
}

class IntersolveIssueTokenResponseIncludesExcludesDto {
  public includes: string[];
  public excludes: string[];
}

class IntersolveIssueTokenResponseMethodMetadataDto {
  code: string;
  period: { start: string; end: string };
  securityCodeInfo: IntersolveIssueTokenResponseSecurityCodeMetadataDto;
}

class IntersolveIssueTokenResponseSecurityCodeMetadataDto {
  required: boolean;
  format: string;
}

export class IntersolveReponseErrorDto {
  public code: string;
  public field: string;
  public description: string;
}
