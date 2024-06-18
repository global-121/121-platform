import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { TokenResponseAsset } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-asset';
import { TokenResponseBalance } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-balance';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';

// TODO: Make properties readonly
export class IssueTokenResponseDto {
  public data: IssueTokenResponseBody;
  public status: number;
  public statusText?: string;
}
// TODO: Make properties readonly
// TODO: REFACTOR: Try to integrate this DTO into the IssueTokenResponseDto, at the moment it is only separately used in the IntersolveVisaApiMockService, refactor possible there?
export class IssueTokenResponseBody {
  public success: boolean;
  public errors?: ErrorsInResponseDto[];
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
  public status?: IntersolveVisaTokenStatus;
  public balances?: TokenResponseBalance[];
  public blockReasonCode?: string;
  public tier?: string;
  public holderId?: string;
  public assets?: TokenResponseAsset[];
}

export class IntersolveCreateWalletResponseIdentityDto {
  public type: string;
  public subType: string;
  public code: string;
}

export class IntersolveCreateWalletResponseConversionDto {
  public toAssetCode: string;
  public automatic: boolean;
  public fromQuantity: number;
  public toQuantity: number;
}

export class IntersolveCreateWalletResponseImageDto {
  public code: string;
  public type: string;
  public url: string;
  public description: string;
}

export class IntersolveCreateWalletResponseVatRegulationDto {
  public code: string;
  public value: number;
}

export class IntersolveCreateWalletResponseTermsAndConditionsDto {
  public url: string;
  public text: string;
}

export class IntersolveCreateWalletResponseChargeRestrictionsDto {
  public product: IntersolveCreateWalletResponseIncludesExcludesDto;
  public productGroup: IntersolveCreateWalletResponseIncludesExcludesDto;
}

class IntersolveCreateWalletResponseIncludesExcludesDto {
  public includes: string[];
  public excludes: string[];
}

export class IntersolveCreateWalletResponseMethodMetadataDto {
  code: string;
  period: { start: string; end: string };
  securityCodeInfo: IntersolveCreateWalletResponseSecurityCodeMetadataDto;
}

class IntersolveCreateWalletResponseSecurityCodeMetadataDto {
  required: boolean;
  format: string;
}
