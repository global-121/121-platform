import { Injectable } from '@nestjs/common';

import { AirtelDisbursementOrEnquiryResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/airtel/dtos/airtel-api-disbursement-or-enquiry-response-body.dto';
import { AirtelDisbursementResultEnum } from '@121-service/src/fsp-integrations/integrations/airtel/enums/airtel-disbursement-result.enum';
import { AirtelApiDisbursementStatusResponseCodeEnum } from '@121-service/src/fsp-integrations/integrations/airtel/services/enums/airtel-api-disbursement-result-status.enum';

@Injectable()
export class AirtelApiHelperService {
  public isAirtelDisbursementOrEnquiryResponseBodyDto(
    responseObj: unknown,
  ): responseObj is AirtelDisbursementOrEnquiryResponseBodyDto {
    const responseCode = (responseObj as any)?.status?.response_code;
    const message = (responseObj as any)?.status?.message;

    return responseCode !== undefined && message !== undefined;
  }

  public getDisbursementResultForResponseCode(
    responseCode: string | undefined,
  ): AirtelDisbursementResultEnum {
    switch (responseCode) {
      case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001001:
        return AirtelDisbursementResultEnum.success;
      case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001011:
        return AirtelDisbursementResultEnum.duplicate;
      case AirtelApiDisbursementStatusResponseCodeEnum.DP00900001000:
        return AirtelDisbursementResultEnum.ambiguous;
      // If we get an unknown response code, we treat it as a failure. Unlikely
      // to happen, and we display the response code in the UI anyway so end
      // user can still solve it.
      default:
        return AirtelDisbursementResultEnum.fail;
    }
  }
}
