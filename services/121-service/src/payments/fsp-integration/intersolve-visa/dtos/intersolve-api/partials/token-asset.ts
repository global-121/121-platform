export interface TokenAsset {
  readonly identity: {
    readonly type: string;
    readonly subType: string;
    readonly code: string;
  };
  readonly groupCode: string;
  readonly parentAssetCode: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly minorUnit: number;
  readonly tags: string[];
  readonly conversions: {
    readonly toAssetCode: string;
    readonly automatic: boolean;
    readonly fromQuantity: number;
    readonly toQuantity: number;
  }[];
  readonly images: {
    readonly code: string;
    readonly type: string;
    readonly url: string;
    readonly description: string;
  }[];
  readonly vatRegulation: {
    readonly code: string;
    readonly value: number;
  };
  readonly termsAndConditions: {
    readonly url: string;
    readonly text: string;
  };
  readonly amount: number;
  readonly currency: string;
  readonly articleCode: string;
  readonly percentage: number;
  readonly rank: number;
  readonly unit: string;
  readonly promotionCode: string;
  readonly ticket: string;
  readonly chargeRestrictions: {
    readonly product: {
      readonly includes: string[];
      readonly excludes: string[];
    };
    readonly productGroup: {
      readonly includes: string[];
      readonly excludes: string[];
    };
  };
  readonly allowedMethods: {
    readonly code: string;
    readonly period: { start: string; end: string };
    readonly securityCodeInfo: {
      readonly required: boolean;
      readonly format: string;
    };
  }[];
}
