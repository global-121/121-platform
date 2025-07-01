import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';

import { OnafriqApiCallServiceRequestBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-call-service-request-body.dto';
import { OnafriqApiCallServiceResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-call-service-response-body.dto';
import { OnafriqApiCallServiceResponseTransactionStatusCode } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-call-service-response-transaction-status-code.enum';
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
  }): OnafriqApiCallServiceRequestBody {
    const batchId = uuid(); // Generate a new batch ID for each request
    const mfsSign = this.generateMfsSign(
      process.env.ONAFRIQ_PASSWORD!,
      batchId,
      process.env.ONAFRIQ_UNIQUE_KEY!,
    );
    const currencyCode = process.env.ONAFRIQ_CURRENCY_CODE!;
    const countryCode = process.env.ONAFRIQ_COUNTRY_CODE!;
    const callServicePayload: OnafriqApiCallServiceRequestBody = {
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
    callServiceResponse: OnafriqApiCallServiceResponseBody,
  ): CallServiceResult {
    const transResponse =
      callServiceResponse?.data?.details?.transResponse?.[0];
    const status = transResponse?.status;

    // NOTE 1: we assume in the below there is only one transaction per batch (which is how we make the request)
    // NOTE 2: the response data also contains data on totalTxSent, noTxAccepted, noTxRejected, which could theoretically be not adding up or not aligining with the status per transaction. We choose to focus on the information on transaction-level.
    // NOTE 3: we have successfully tested manually that the error handling (here plus in parent method) also correctly handles bad gateway/timeout/ECONNRESET errors. There are no separate API-tests on this, as logically this is part of the same generic-error scenario.
    // NOTE 4: there is unfortunately no specific error code for duplicate thirdPartyTransId, so must be done on messageDetail
    if (
      status.messageDetail === 'Transaction already exist with given ThirdParty'
    ) {
      return {
        status: OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError,
        errorMessage: `Error: duplicate thirdPartyTransId error for thirdPartyTransId ${transResponse.thirdPartyId}`,
      };
    }

    if (
      status.code ===
      OnafriqApiCallServiceResponseTransactionStatusCode.rejected
    ) {
      return {
        status: OnafriqApiResponseStatusType.genericError,
        errorMessage: `Error: ${status?.code} - ${status?.message} - ${status?.messageDetail}`,
      };
    }

    // If status exists and does not have code 101, this implies success
    return { status: OnafriqApiResponseStatusType.success };
  }

  public isOnafriqApiCallServiceResponseBody(
    responseObj: unknown,
  ): responseObj is OnafriqApiCallServiceResponseBody {
    const status = (responseObj as any)?.data?.details?.transResponse?.[0]
      ?.status;
    return typeof status !== 'undefined';
  }

  public serializeErrorResponseData(responseObj: unknown): string {
    let jsonString: string;
    try {
      jsonString = JSON.stringify((responseObj as any)?.data);
    } catch {
      jsonString = '[Unserializable data]';
    }
    return jsonString;
  }
}
