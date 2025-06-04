import { AirtelDisbursementOrEnquiryResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-or-enquiry-result.enum';

export const AirtelDisbursementOrEnquiryResultMapper = (
  responseCode: string,
): AirtelDisbursementOrEnquiryResultEnum => {
  switch (responseCode) {
    // Not numerically ordered to make the switch more readable.
    case 'DP00900001015':
      return AirtelDisbursementOrEnquiryResultEnum.not_found;
    case 'DP00900001001':
      return AirtelDisbursementOrEnquiryResultEnum.success;
    case 'DP00900001000':
    case 'DP00900001006':
      return AirtelDisbursementOrEnquiryResultEnum.processing;
    case 'DP00900001003':
    case 'DP00900001004':
    case 'DP00900001005':
    case 'DP00900001007':
    case 'DP00900001009':
    case 'DP00900001010':
    case 'DP00900001011':
    case 'DP00900001012':
    case 'DP00900001013':
    case 'DP00900001014':
    case 'DP00900001016':
      return AirtelDisbursementOrEnquiryResultEnum.fail;
    default:
      return AirtelDisbursementOrEnquiryResultEnum.unfamiliar_response_code;
  }
};
