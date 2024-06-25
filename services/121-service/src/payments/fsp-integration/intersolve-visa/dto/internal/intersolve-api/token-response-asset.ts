import {
  IntersolveCreateWalletResponseChargeRestrictionsDto,
  IntersolveCreateWalletResponseConversionDto,
  IntersolveCreateWalletResponseIdentityDto,
  IntersolveCreateWalletResponseImageDto,
  IntersolveCreateWalletResponseMethodMetadataDto,
  IntersolveCreateWalletResponseTermsAndConditionsDto,
  IntersolveCreateWalletResponseVatRegulationDto,
} from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-create-wallet-response.dto';

// TODO: Make properties readonly
// TODO: Refactor properties that are (partial) DTOs according to DTO guidelines.
export class TokenResponseAsset {
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
