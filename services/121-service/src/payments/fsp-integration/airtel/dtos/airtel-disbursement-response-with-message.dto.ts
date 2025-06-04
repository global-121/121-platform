import { AirtelDisbursementOrEnquiryResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-or-enquiry-result.enum';

export interface AirtelDisbursementResponseWithMessageDto {
  readonly result: AirtelDisbursementOrEnquiryResultEnum;
  readonly message: string;
}
