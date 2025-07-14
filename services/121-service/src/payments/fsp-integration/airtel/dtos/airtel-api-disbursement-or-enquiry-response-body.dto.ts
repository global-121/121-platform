import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';

export interface AirtelDisbursementOrEnquiryResponseBodyDto {
  readonly status: {
    readonly message: string;
    readonly response_code: AirtelDisbursementResultEnum;
  };
}
