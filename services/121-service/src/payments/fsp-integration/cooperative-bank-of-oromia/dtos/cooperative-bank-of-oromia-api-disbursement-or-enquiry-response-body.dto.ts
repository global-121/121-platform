import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';

export interface CooperativeBankOfOromiaDisbursementOrEnquiryResponseBodyDto {
  readonly status: {
    readonly message: string;
    readonly response_code: CooperativeBankOfOromiaDisbursementResultEnum;
  };
}
