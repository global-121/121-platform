import { Injectable } from '@nestjs/common';

import { CooperativeBankOfOromiaDisbursementOrEnquiryResponseBodyDto } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-disbursement-or-enquiry-response-body.dto';
import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/enums/cooperative-bank-of-oromia-api-disbursement-result-status.enum';

@Injectable()
export class CooperativeBankOfOromiaApiHelperService {
  public isAirtelDisbursementOrEnquiryResponseBodyDto(
    responseObj: unknown,
  ): responseObj is CooperativeBankOfOromiaDisbursementOrEnquiryResponseBodyDto {
    const responseCode = (responseObj as any)?.status?.response_code;
    const message = (responseObj as any)?.status?.message;

    return responseCode !== undefined && message !== undefined;
  }

  public getDisbursementResultForResponseCode(
    responseCode: string | undefined,
  ): CooperativeBankOfOromiaDisbursementResultEnum {
    switch (responseCode) {
      case CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001001:
        return CooperativeBankOfOromiaDisbursementResultEnum.success;
      case CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001011:
        return CooperativeBankOfOromiaDisbursementResultEnum.duplicate;
      case CooperativeBankOfOromiaApiDisbursementStatusResponseCodeEnum.DP00900001000:
        return CooperativeBankOfOromiaDisbursementResultEnum.ambiguous;
      // If we get an unknown response code, we treat it as a failure. Unlikely
      // to happen, and we display the response code in the UI anyway so end
      // user can still solve it.
      default:
        return CooperativeBankOfOromiaDisbursementResultEnum.fail;
    }
  }
}
