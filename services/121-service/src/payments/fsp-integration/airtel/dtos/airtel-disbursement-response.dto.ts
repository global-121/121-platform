import { AirtelDisbursementOrEnquiryResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-or-enquiry-result.enum';

export interface AirtelDisbursementResponseDto {
  readonly result: AirtelDisbursementOrEnquiryResultEnum;
  readonly data: any;
}
