import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

import { CallServiceRequestOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-request-onafriq-api.dto';
import { CallServiceResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-response-onafriq-api.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { CallServiceResult } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/call-service-result.interface.';

@Injectable()
export class OnafriqApiHelperService {
  public createCallServicePayload({
    transferAmount,
    phoneNumber,
    firstName,
    lastName,
    thirdPartyTransId,
  }): CallServiceRequestOnafriqApiDto {
    const batchId = uuid(); // Generate a new batch ID for each request
    const mfsSign = this.generateMfsSign(
      process.env.ONAFRIQ_PASSWORD!,
      batchId,
      process.env.ONAFRIQ_UNIQUE_KEY!,
    );
    const currencyCode = process.env.ONAFRIQ_CURRENCY_CODE!;
    const countryCode = process.env.ONAFRIQ_COUNTRY_CODE!;
    const callServicePayload: CallServiceRequestOnafriqApiDto = {
      corporateCode: process.env.ONAFRIQ_CORPORATE_CODE!,
      password: process.env.ONAFRIQ_PASSWORD!,
      mfsSign,
      batchId,
      requestBody: [
        {
          instructionType: {
            destAcctType: 1, // 1 = Mobile Money
            amountType: 2, // 2 = Receive Amount
          },
          amount: {
            amount: transferAmount,
            currencyCode,
          },
          sender: {
            // NOTE: this can be anything for now in sandbox. Find out production config. See AB#36783
            msisdn: '1234567890',
            fromCountry: countryCode,
            name: 'Red Cross DRC',
            surname: 'Red Cross DRC',
            dateOfBirth: '1980-01-01',
            document: {
              idNumber: '123456789',
              idType: 'ID1',
            },
          },
          recipient: {
            msisdn: phoneNumber,
            toCountry: countryCode,
            name: firstName,
            surname: lastName,
          },
          thirdPartyTransId,
          purposeOfTransfer: 'PT3',
        },
      ],
    };
    return callServicePayload;
  }

  private generateMfsSign(
    password: string,
    batchId: string,
    uniqueKey: string,
  ): string {
    const dataToHash = `${password}${batchId}${uniqueKey}`;
    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }

  public processCallServiceResponse(
    callServiceResponse: CallServiceResponseOnafriqApiDto,
  ): CallServiceResult {
    // NOTE: we assume in the below there is only one transaction per batch (which is the case)
    if (!callServiceResponse?.data) {
      return {
        status: OnafriqApiResponseStatusType.genericError,
        errorMessage: 'No response data from Onafriq API',
      };
    }

    const transResponse = callServiceResponse.data.details?.transResponse[0];
    const statusDetails = transResponse?.status;
    // NOTE: there is unfortunately no specific error code for this, so must be done on messageDetail
    if (
      statusDetails?.messageDetail ===
      'Transaction already exist with given ThirdParty'
    ) {
      return {
        status: OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError,
        errorMessage: `Error: duplicate thirdPartyTransId error for thirdPartyTransId ${transResponse.thirdPartyId}`,
      };
    }

    if (callServiceResponse.data.noTxRejected === 1) {
      return {
        status: OnafriqApiResponseStatusType.genericError,
        errorMessage: `Error: ${statusDetails?.code} - ${statusDetails?.message} - ${statusDetails?.messageDetail}`,
      };
    }
    return { status: OnafriqApiResponseStatusType.success };
  }
}
