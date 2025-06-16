import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';

export const AirtelDisbursementOrEnquiryResultMapper = (
  responseCode: string,
): AirtelDisbursementResultEnum => {
  switch (responseCode) {
    case 'DP00900001001':
      return AirtelDisbursementResultEnum.success;
    case 'DP00900001011':
      return AirtelDisbursementResultEnum.duplicate;
    default:
      return AirtelDisbursementResultEnum.fail;
  }
};
