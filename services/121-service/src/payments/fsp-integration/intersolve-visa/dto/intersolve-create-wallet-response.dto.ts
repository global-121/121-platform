import { IntersolveVisaWalletStatus } from '../intersolve-visa-wallet.entity';
import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class IntersolveCreateWalletResponseDto {
  public data: IntersolveCreateWalletResponseBodyDto;
  public status: number;
  public statusText?: string;
}

export class IntersolveCreateWalletResponseBodyDto {
  public success: boolean;
  public errors?: IntersolveReponseErrorDto[];
  public code?: string;
  public correlationId?: string;
  public data: IntersolveCreateWalletResponseDataDto;
}

export class IntersolveCreateWalletResponseDataDto {
  public token: IntersolveCreateWalletResponseTokenDto;
}

export class IntersolveCreateWalletResponseTokenDto {
  public code: string;
  public blocked?: boolean;
  public type?: string;
  public brandTypeCode?: string;
  public status?: IntersolveVisaWalletStatus;
  public balances?: IntersolveCreateWalletResponseBalanceDto[];
  public blockReasonCode?: string;
  public tier?: string;
  public holderId?: string;
  public assets?: IntersolveCreateWalletResponseAssetDto[];
}

export class IntersolveCreateWalletResponseBalanceDto {
  public quantity: IntersolveCreateWalletResponseQuantityDto;
  public discountBudgetValue: number;
  public lastChangedAt: string;
}

class IntersolveCreateWalletResponseQuantityDto {
  public assetCode: string;
  public value: number;
  public reserved: number;
}

export class IntersolveCreateWalletResponseAssetDto {
  public identity: IntersolveCreateWalletResponseIdentityDto;
  public groupCode: string;
  public parentAssetCode: string;
  public name: string;
  public description: string;
  public status: string;
  public minorUnit: number;
  public tags: string[];
  public conversions: IntersolveCreateWalletResponseConversionDto[];
  public images: IntersolveCreateWalletResponseImageDto[];
  public vatRegulation: IntersolveCreateWalletResponseVatRegulationDto;
  public termsAndConditions: IntersolveCreateWalletResponseTermsAndConditionsDto;
  public amount: number;
  public currency: string;
  public articleCode: string;
  public percentage: number;
  public rank: number;
  public unit: string;
  public promotionCode: string;
  public ticket: string;
  public chargeRestrictions: IntersolveCreateWalletResponseChargeRestrictionsDto;
  public allowedMethods: IntersolveCreateWalletResponseMethodMetadataDto[];
}

class IntersolveCreateWalletResponseIdentityDto {
  public type: string;
  public subType: string;
  public code: string;
}

class IntersolveCreateWalletResponseConversionDto {
  public toAssetCode: string;
  public automatic: boolean;
  public fromQuantity: number;
  public toQuantity: number;
}

class IntersolveCreateWalletResponseImageDto {
  public code: string;
  public type: string;
  public url: string;
  public description: string;
}

class IntersolveCreateWalletResponseVatRegulationDto {
  public code: string;
  public value: number;
}

class IntersolveCreateWalletResponseTermsAndConditionsDto {
  public url: string;
  public text: string;
}

class IntersolveCreateWalletResponseChargeRestrictionsDto {
  public product: IntersolveCreateWalletResponseIncludesExcludesDto;
  public productGroup: IntersolveCreateWalletResponseIncludesExcludesDto;
}

class IntersolveCreateWalletResponseIncludesExcludesDto {
  public includes: string[];
  public excludes: string[];
}

class IntersolveCreateWalletResponseMethodMetadataDto {
  code: string;
  period: { start: string; end: string };
  securityCodeInfo: IntersolveCreateWalletResponseSecurityCodeMetadataDto;
}

class IntersolveCreateWalletResponseSecurityCodeMetadataDto {
  required: boolean;
  format: string;
}
