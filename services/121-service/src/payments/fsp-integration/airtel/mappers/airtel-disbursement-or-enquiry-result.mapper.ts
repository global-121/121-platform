import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelApiDisbursementStatusResponseCodeEnum } from '@121-service/src/payments/fsp-integration/airtel/services/enums/airtel-api-disbursement-result-status.enum';

export const AirtelDisbursementOrEnquiryResultMapper = (
  responseCode: string,
): AirtelDisbursementResultEnum => {
  switch (responseCode) {
    case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001001:
      return AirtelDisbursementResultEnum.success;
    case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001011:
      return AirtelDisbursementResultEnum.duplicate;
    case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001000:
      return AirtelDisbursementResultEnum.ambiguous;
    default:
      return AirtelDisbursementResultEnum.fail;
  }
};
