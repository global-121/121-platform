import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto'; // Add this import
import { v4 as uuid } from 'uuid';

import { CallServiceRequestOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-request-onafriq-api.dto';
import { CallServiceResponseOnafriqApiDto } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/call-service-response-onafriq-api.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';

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
          sendFee: {
            // ##TODO: sendFee should not be needed with amountType = 2, so can be removed
            amount: 0,
            currencyCode,
          },
          sender: {
            // ##TODO: this can be anything for now in sandbox, just fill in something
            msisdn: '1234567890', // ##TODO
            fromCountry: countryCode,
            name: 'Red Cross DRC',
            surname: 'Red Cross DRC',
            document: {
              idNumber: '123456789', // ##TODO
              idType: 'ID1', // ##TODO
              idCountry: countryCode, // ##TODO
              idExpiry: '2025-12-31', // ##TODO: conditional. on what?
            },
          },
          recipient: {
            msisdn: phoneNumber,
            toCountry: countryCode,
            name: firstName,
            surname: lastName,
            address: 'Recipient Address', // ##TODO: conditional. on what?
            city: 'Kinshasa', // ##TODO: conditional. on what?
            destinationAccount: {
              accountNumber: '1234567890', // ##TODO: conditional. on what?
            },
          },
          thirdPartyTransId,
          purposeOfTransfer: 'PT3', // ##TODO: PT3 = BUSINESS PAYMENT. Is this correct?
          sourceOfFunds: 'SF6', // ##TODO: SF6 = OTHER (see https://developers.onafriq.com/docs/remittance-apis-v1/ltkyfhltgh35s-async-api-methods). Is this correct? (And is this needed? It says 'conditional'.)
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
  ): {
    status: OnafriqApiResponseStatusType;
    errorMessage?: string;
  } {
    // NOTE: we assume in the below there is only one transaction per batch (which is the case)
    // ##TODO: check/scrutinize possible error scenarios a lot more
    if (!callServiceResponse || !callServiceResponse.data) {
      return {
        status: OnafriqApiResponseStatusType.genericError,
        errorMessage: 'No response data from Onafriq API',
      };
    } else if (
      callServiceResponse.data.details?.transResponse[0]?.status
        ?.messageDetail === 'Transaction already exist with given ThirdParty' //##TODO: get exact code for this?
    ) {
      return {
        status: OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError,
        errorMessage: `Error: duplicate thirdPartyTransId error for thirdPartyTransId ${callServiceResponse.data.details?.transResponse[0]?.thirdPartyId}`,
      };
    } else if (callServiceResponse.data.noTxRejected === 1) {
      const errorObj =
        callServiceResponse.data.details?.transResponse[0]?.status;
      return {
        status: OnafriqApiResponseStatusType.genericError,
        errorMessage: `Error: ${errorObj?.code} - ${errorObj?.message} - ${errorObj?.messageDetail}`,
      };
    }

    return {
      status: OnafriqApiResponseStatusType.success,
    };
  }
}
